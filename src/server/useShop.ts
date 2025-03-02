import { toRefs } from "vue";
import { e, s, i } from "@/log";
import type { Card, PlayerData } from "@/types";
import { gameStore, playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, deleteField, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { converter } from "@/server/converter";
import { wait } from "@/server/utils";
import { getEnemyPlayer } from "@/server/usePlayerData";
import { setMissions, setHand, setOffer } from "@/server/useShopUtils";
import { battle } from "@/server/useBattle";
import allGifts from "@/assets/allGifts";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());

//shopフェーズの開始
async function startShop(): Promise<void> {
  console.log(i, "startShopを実行しました");
  const { phase } = storeToRefs(playerStore);
  const { game, missions } = storeToRefs(gameStore);

  phase.value = "shop";
  console.log(i, "phase: ", phase.value);
  if (game.value.turn % 4 == 1) {
    setMissions();
  }
  if (game.value.turn === 1) {
    setHand();
    phase.value = "battle";
  } else setOffer();
}
//shopフェーズの終了
async function endShop(): Promise<void> {
  console.log(i, "endShopを実行しました");
  const { id, player, phase, myLog, enemyLog, cardLock } = storeToRefs(playerStore);
  const { isSelectedGift, status, check, idEnemy, hand, death } = toRefs(player.value);

  //腐ったカードが9枚の場合、ゲームを終了する
  if (hand.value.length === 9) {
    const rottenCards = hand.value.reduce((acc: number, cur: Card) => {
      if (cur.id === 0) acc++;
      return acc;
    }, 0);
    if (rottenCards === 9) {
      phase.value = "result";
      death.value = true;
      updateDoc(doc(playersRef, id.value), { death: true });
      updateDoc(doc(playersRef, idEnemy.value), { death: true });
      return;
    }
    setTimeout(async () => {
      const deathData = (await getDoc(doc(playersRef, idEnemy.value))).data()?.death as boolean;
      death.value = deathData;
    }, 100);
  }
  //自分のisSelectedGiftを実行する
  const myGift = isSelectedGift.value;
  if (myGift !== undefined) {
    allGifts[myGift].skill();
    status.value.contribution -= allGifts[myGift].requireContribution;
    myLog.value = allGifts[myGift].name + "を使った！";
  }
  //相手のisSelectedGiftを実行する
  const enemyGift = (await getDoc(doc(playersRef, idEnemy.value))).data()?.isSelectedGift as number | undefined;
  if (enemyGift !== undefined) enemyLog.value = allGifts[enemyGift].name + "を使った！";

  //終了時処理
  phase.value = "battle";
  check.value = false;
  cardLock.value = false;
  updateDoc(doc(playersRef, id.value), { check: check.value });
  updateDoc(doc(playersRef, id.value), { status: status.value });
  updateDoc(doc(playersRef, id.value), { isSelectedGift: isSelectedGift.value });
  console.log(i, "check: " + check.value);
  getEnemyPlayer(); //!
}
//checkの値の監視
async function watchShopEnd(): Promise<void> {
  console.log(i, "watchShopEndを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { check, idEnemy, isSelectedGift, hand } = toRefs(player.value);

  //Firestoreに保存する
  updateDoc(doc(playersRef, id.value), { isSelectedGift: isSelectedGift.value });
  if (isSelectedGift.value === undefined) updateDoc(doc(playersRef, id.value), { isSelectedGift: deleteField() });
  updateDoc(doc(playersRef, id.value), { hand: hand.value });

  //checkの値がtrueになっていたら､shopフェーズを終了する
  check.value = true;
  updateDoc(doc(playersRef, id.value), { check: check.value });
  console.log(i, "check: " + check.value);
  const enemyCheck = (await getDoc(doc(playersRef, idEnemy.value))).data()?.check;
  if (enemyCheck) {
    endShop();
  } else {
    const unsubscribe = onSnapshot(doc(playersRef, idEnemy.value), (doc) => {
      const data = doc.data();
      if (!data) return;
      if (data.check) {
        endShop();
        //監視を解除する
        unsubscribe();
        console.log(i, "checkの監視を解除しました");
      }
    });
  }
}
//checkの値の監視
async function watchTurnEnd(): Promise<void> {
  console.log(i, "watchTurnEndを実行しました");
  const { id, player, sumCards } = storeToRefs(playerStore);
  const { check, idEnemy, sumFields, donate, field, hand } = toRefs(player.value);

  //checkの値がtrueになっていたら､カード選択終了
  check.value = true;
  sumFields.value = sumCards.value;
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
  updateDoc(doc(playersRef, id.value), { field: field.value });
  updateDoc(doc(playersRef, id.value), { check: check.value });
  updateDoc(doc(playersRef, id.value), { donate: donate.value });
  updateDoc(doc(playersRef, id.value), { sumFields: sumFields.value });
  const enemyCheck = (await getDoc(doc(playersRef, idEnemy.value))).data()?.check;
  if (enemyCheck) {
    battle();
  } else {
    const unsubscribe = onSnapshot(doc(playersRef, idEnemy.value), (doc) => {
      const data = doc.data();
      if (!data) return;
      if (data.check) {
        battle();
        //監視を解除する
        unsubscribe();
        console.log(i, "checkの監視を解除しました");
      }
    });
  }
}
export { startShop, watchShopEnd, watchTurnEnd };
