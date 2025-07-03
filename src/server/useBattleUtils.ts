import { toRefs } from "vue";
import { e, i, s } from "@/log";
import { enemyPlayerStore, gameStore, playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, deleteField, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import type { GameData, PlayerData, PlayerSign, Status, SumCards, Card } from "@/types";
import { converter } from "@/server/converter";
import { intervalForEach, wait, XOR } from "@/server/utils";
import { getEnemyPlayer } from "@/server/usePlayerData";
import { BATTLE_CONSTANTS } from "@/consts";
import allGifts from "@/assets/allGifts";
//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

//Playerを同期する
async function syncPlayer(which: "primary" | "second"): Promise<{ myId: string; enemyId: string; my: PlayerData; enemy: PlayerData }> {
  const { id, player, sign } = storeToRefs(playerStore);
  const { idEnemy } = toRefs(player.value);
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);

  //自分と相手のidを取得する
  let myId, enemyId;
  const playerAllocation =
    firstAtkPlayer.value === sign.value ? BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST : BATTLE_CONSTANTS.PLAYER_ALLOCATION.SECOND;
  // 自分が先行なら1,後攻なら0
  const isCurrentPlayerFirstAttacker = playerAllocation === BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST;
  const isPrimarySync = which === "primary";

  const shouldUseEnemyIdAsMyId = XOR(isCurrentPlayerFirstAttacker, isPrimarySync);

  // myIdとenemyIdを決定する
  myId = shouldUseEnemyIdAsMyId ? idEnemy.value : id.value;
  enemyId = shouldUseEnemyIdAsMyId ? id.value : idEnemy.value;
  //statusを取得する
  let my = (await getDoc(doc(playersRef, myId))).data() as PlayerData;
  let enemy = (await getDoc(doc(playersRef, enemyId))).data() as PlayerData;
  if (!my) throw Error("自分の情報が取得できませんでした");
  if (!enemy) throw Error("相手の情報が取得できませんでした");
  return { myId, enemyId, my, enemy };
}
//ダメージを反映する
async function reflectStatus(): Promise<void> {
  console.log(s, "reflectDamageを実行しました");
  const { player, id } = storeToRefs(playerStore);
  const { status, sumFields, check, death } = toRefs(player.value);
  //ダメージを反映する
  let myPlayer = (await getDoc(doc(playersRef, id.value))).data() as PlayerData;
  let myPlayerStatus = myPlayer.status as Status;
  let myPlayerSumFields = myPlayer.sumFields as SumCards;
  let myPlayerCheck = myPlayer.check;
  let myPlayerDeath = myPlayer.death;

  if (!myPlayerStatus) throw Error("myStatusが取得できませんでした");
  if (!myPlayerSumFields) throw Error("mySumFieldsが取得できませんでした");
  if (myPlayerCheck === undefined) throw Error("myCheckが取得できませんでした");
  if (myPlayerDeath === undefined) throw Error("myDeathが取得できませんでした");
  status.value = myPlayerStatus;
  sumFields.value = myPlayerSumFields;
  check.value = myPlayerCheck;
  death.value = myPlayerDeath;
  console.log("reflectDamage end");
}
//死亡判定
async function checkDeath(p: PlayerData): Promise<boolean> {
  console.log(s, "checkDeathを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { idEnemy } = toRefs(player.value);

  if (p.status.hp <= 0) {
    updateDoc(doc(playersRef, id.value), { death: true });
    updateDoc(doc(playersRef, idEnemy.value), { death: true });
    return true;
  }
  return false;
}
//情報更新処理
async function everyUtil(params: [string, number]): Promise<void> {
  const { battleResult } = storeToRefs(playerStore);

  await reflectStatus();
  await getEnemyPlayer(); //!
  battleResult.value = params;
  await wait(BATTLE_CONSTANTS.WAIT_TIME.BATTLE_PHASE);
}
//指定された､fieldの値を比較する
async function compareSumField(field: "hungry"): Promise<void> {
  console.log(s, "compareSum", field, "を実行しました");
  const { player, sign } = storeToRefs(playerStore);
  const { idEnemy, sumFields } = toRefs(player.value);
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);

  const getSwitchedPlayerSign = (playerSign: PlayerSign): PlayerSign => (playerSign === 0 ? 1 : 0);
  let enemySumFields = (await getDoc(doc(playersRef, idEnemy.value))).data()?.sumFields as SumCards;
  console.log(i, "sum", field, ": ", sumFields.value[field]);
  console.log(i, "enemySum", field, ": ", enemySumFields?.[field]);
  //hungryの値が小さい方が先行//hungryの値が同じならばFirstAtkPlayerの値を変更しない
  if (sumFields.value[field] < (enemySumFields?.[field] ?? 0)) {
    firstAtkPlayer.value = sign.value;
  } else if (sumFields.value[field] > (enemySumFields?.[field] ?? 0)) {
    firstAtkPlayer.value = getSwitchedPlayerSign(sign.value);
  } else {
    console.log(i, field, "の値が同じなので");
  }
}
//firstAtkPlayerの値の監視
async function watchFirstAtkPlayerField(): Promise<void> {
  console.log(s, "watchFirstAtkPlayerFieldを実行しました");
  const { player, sign } = storeToRefs(playerStore);
  const { idGame } = toRefs(player.value);
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);

  if (sign.value == 1) {
    const unsubscribe = onSnapshot(doc(gamesRef, idGame.value), (snap) => {
      const data = snap.data();
      if (!data) return;
      if (data.firstAtkPlayer !== undefined) {
        firstAtkPlayer.value = data.firstAtkPlayer === 0 ? 0 : 1;
        updateDoc(doc(gamesRef, idGame.value), { firstAtkPlayer: deleteField() });
        console.log(i, "受け取ったfirstAtkPlayer: ", firstAtkPlayer.value);
        //監視を解除する
        unsubscribe();
        console.log(i, "firstAtkPlayerの監視を解除しました");
      }
    });
  } else {
    //先行後攻を決める//0か1をランダムに生成
    firstAtkPlayer.value = Math.random() < 0.5 ? BATTLE_CONSTANTS.PLAYER_ALLOCATION.SECOND : BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST;
    console.log(i, "ランダムで決まったplayer: ", firstAtkPlayer.value);
    updateDoc(doc(gamesRef, idGame.value), { firstAtkPlayer: firstAtkPlayer.value });
  }
}
//先行後攻を決める
async function decideFirstAtkPlayer(): Promise<void> {
  console.log(s, "decideFirstAtkPlayerを実行しました");
  const { components } = storeToRefs(playerStore);
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);

  await watchFirstAtkPlayerField();
  await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  await compareSumField("hungry");
  if (firstAtkPlayer.value === undefined) throw new Error("firstAtkPlayerの値がundefinedです");

  await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  await getEnemyPlayer();
  components.value = "afterDecideFirstAtkPlayer";
}
// gift決定
function decideGiftActive(): number {
  console.log(s, "decideGiftActiveを実行しました");

  const randomGiftIndex = Math.floor(Math.random() * allGifts.length);
  const randomGift = allGifts[randomGiftIndex];
  console.log(i, "発動するgift: ", randomGift);
  updateDoc(doc(playersRef, playerStore.id), { giftActiveId: randomGift.id });
  return randomGift.id;
}

// gift発動
async function giftCheck(order: "primary" | "second"): Promise<void> {
  console.log(s, "giftActiveを実行しました");
  const { player, sign, myLog, enemyLog } = storeToRefs(playerStore);
  const { giftActiveId } = toRefs(player.value);
  const { enemyPlayer } = storeToRefs(enemyPlayerStore);
  const { giftActiveId: enemyGiftActiveId } = toRefs(enemyPlayer.value);

  if (order === "primary") {
    if (giftActiveId.value !== -1) {
      myLog.value = `ギフトパック: ${allGifts[giftActiveId.value].name}を使用します`;
      await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
      // giftActiveId.value = -1;
    }
  }
  if (order === "second") {
    if (enemyGiftActiveId.value !== -1) {
      enemyLog.value = `敵のギフトパック: ${allGifts[enemyGiftActiveId.value].name}を使用します`;
      await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
      // enemyGiftActiveId.value = -1;
    }
  }
}

export { syncPlayer, reflectStatus, checkDeath, everyUtil, decideFirstAtkPlayer, decideGiftActive, giftCheck };
