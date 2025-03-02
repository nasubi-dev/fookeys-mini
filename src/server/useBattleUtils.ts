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
  const playerAllocation = firstAtkPlayer.value === sign.value ? 1 : 0;
  if (playerAllocation) {
    myId = which === "primary" ? id.value : idEnemy.value;
    enemyId = which === "primary" ? idEnemy.value : id.value;
  } else {
    myId = which === "primary" ? idEnemy.value : id.value;
    enemyId = which === "primary" ? id.value : idEnemy.value;
  }
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
  let myPlayerStatus = (await getDoc(doc(playersRef, id.value))).data()?.status as Status;
  let myPlayerSumFields = (await getDoc(doc(playersRef, id.value))).data()?.sumFields as SumCards;
  let myPlayerCheck = (await getDoc(doc(playersRef, id.value))).data()?.check as boolean;
  let myPlayerDeath = (await getDoc(doc(playersRef, id.value))).data()?.death as boolean;
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
//情報更新処理//!paramsはないだろ
async function everyUtil(params: [string, number]): Promise<void> {
  const { battleResult } = storeToRefs(playerStore);

  await reflectStatus();
  await getEnemyPlayer(); //!
  battleResult.value = params;
  await wait(1500);
}
//missionの統括
async function checkMission(which: "primary" | "second"): Promise<void> {
  console.log(s, "checkMissionを実行しました");
  const { id, player, sign, myLog, enemyLog } = storeToRefs(playerStore);
  const { status } = toRefs(player.value);
  const { game, missions } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);
  const { my, enemy } = await syncPlayer(which);
  const playerAllocation = sign.value === firstAtkPlayer.value;

  if (my.check) return;

  //missionを進捗させる
  for (let mission of missions.value ?? []) {
    if (mission.achieved) continue;
    //Missionを進捗させる
    mission.nowAchievement += mission.checker?.(my.donate, my.sumFields, my.field, my.hand) ?? 0;
    //Missionを達成したら報酬を受け取る
    if (mission.nowAchievement >= mission.goalAchievement) {
      mission.achieved = true;
      mission.nowAchievement = mission.goalAchievement;
      if ((playerAllocation && which === "primary") || (!playerAllocation && which === "second")) {
        status.value.contribution += mission.reward;
        myLog.value = "mission: " + mission.name + "を達成したので" + mission.reward + "の貢献度を受け取りました";
      } else {
        enemyLog.value = "mission: " + mission.name + "を達成したので" + mission.reward + "の貢献度を受け取りました";
      }
      updateDoc(doc(playersRef, id.value), { status: status.value });
    }
  }
}
//donateの場合､優先度は最上位になる
async function judgeDonate(): Promise<void> {
  console.log(s, "comparePriorityを実行しました");
  const { id, player, sign } = storeToRefs(playerStore);
  const { idEnemy, donate } = toRefs(player.value);
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);

  //donateの値がtrueの場合､優先度は最上位になる
  const getSwitchedPlayerSign = (playerSign: PlayerSign): PlayerSign => (playerSign === 0 ? 1 : 0);
  const isEnemyDonate = (await getDoc(doc(playersRef, idEnemy.value))).data()?.donate;
  let newFirstAtkPlayer: PlayerSign | undefined = firstAtkPlayer.value;

  if (firstAtkPlayer.value === sign.value) {
    if (donate.value) newFirstAtkPlayer = sign.value;
    if (isEnemyDonate) newFirstAtkPlayer = getSwitchedPlayerSign(sign.value);
  } else {
    if (isEnemyDonate) newFirstAtkPlayer = getSwitchedPlayerSign(sign.value);
    if (donate.value) newFirstAtkPlayer = sign.value;
  }
  if (newFirstAtkPlayer !== undefined) firstAtkPlayer.value = newFirstAtkPlayer;
  console.log(i, "donateの値がtrueの場合､優先度は最上位になる");
}
//指定された､fieldの値を比較する
async function compareSumField(field: "hungry" | "priority"): Promise<void> {
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
    if (field === "hungry") firstAtkPlayer.value = sign.value;
    else if (field === "priority") firstAtkPlayer.value = getSwitchedPlayerSign(sign.value);
    console.log(i, field, "の値が小さいので", firstAtkPlayer.value, "が先行");
  } else if (sumFields.value[field] > (enemySumFields?.[field] ?? 0)) {
    if (field === "hungry") firstAtkPlayer.value = getSwitchedPlayerSign(sign.value);
    else if (field === "priority") firstAtkPlayer.value = sign.value;
    console.log(i, field, "の値が大きいので", firstAtkPlayer.value, "が先行");
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
    firstAtkPlayer.value = Math.random() < 0.5 ? 0 : 1;
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
  await wait(1000);
  await compareSumField("hungry");
  await compareSumField("priority");
  await judgeDonate();
  if (firstAtkPlayer.value === undefined) throw new Error("firstAtkPlayerの値がundefinedです");

  await wait(1000);
  await getEnemyPlayer();
  components.value = "afterDecideFirstAtkPlayer";
}

export { syncPlayer, reflectStatus, checkDeath, everyUtil, checkMission, decideFirstAtkPlayer };
