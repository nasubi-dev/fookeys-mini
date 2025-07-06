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
import { setHand, setOffer } from "@/server/useShopUtils";
import { battle } from "@/server/useBattle";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());

//shopフェーズの開始
async function startShop(): Promise<void> {
  console.log(i, "startShopを実行しました");
  const { phase } = storeToRefs(playerStore);
  const { game } = storeToRefs(gameStore);

  phase.value = "shop";
  console.log(i, "phase: ", phase.value);
  if (game.value.turn === 1) {
    setHand();
    phase.value = "battle";
  } else setOffer();
}
//shopフェーズの終了
async function endShop(): Promise<void> {
  console.log(i, "endShopを実行しました");
  const { id, player, phase, cardLock } = storeToRefs(playerStore);
  const { status, check } = toRefs(player.value);

  //終了時処理
  phase.value = "battle";
  check.value = false;
  cardLock.value = false;
  updateDoc(doc(playersRef, id.value), { check: check.value });
  updateDoc(doc(playersRef, id.value), { status: status.value });
  console.log(i, "check: " + check.value);
  getEnemyPlayer(); //!
}
//checkの値の監視
async function watchShopEnd(): Promise<void> {
  console.log(i, "watchShopEndを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { check, idEnemy, hand } = toRefs(player.value);

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
  const { check, idEnemy, sumFields, field, hand } = toRefs(player.value);

  //checkの値がtrueになっていたら､カード選択終了
  check.value = true;
  sumFields.value = sumCards.value;
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
  updateDoc(doc(playersRef, id.value), { field: field.value });
  updateDoc(doc(playersRef, id.value), { check: check.value });
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
