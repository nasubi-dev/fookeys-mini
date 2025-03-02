import { toRefs } from "vue";
import _cloneDeep from "lodash/cloneDeep";
import _isEqual from "lodash/isEqual";
import { e, s, i } from "@/log";
import { gameStore, playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, deleteField, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { converter } from "@/server/converter";
import type { Card, GameData, PlayerData, Attribute, Status, SumCards } from "@/types";
import allMissions from "@/assets/allMissions";
import allCards from "@/assets/allCards";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

//cardをランダムに1枚引く
function drawCard(attribute?: Attribute): Card {
  const { player, offer } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  let selectCard;
  while (!selectCard) {
    if (attribute) {
      const pickCard = structuredClone(allCards[Math.floor(Math.random() * allCards.length)]);
      //すでに同じカードがある場合は引き直す
      if (hand.value.find((card) => card.id === pickCard.id)) continue;
      if (offer.value.find((card) => card.id === pickCard.id)) continue;
      if (attribute === "atk" && pickCard.id >= 1 && pickCard.id <= 16) selectCard = pickCard;
      if (attribute === "tech" && pickCard.id >= 17 && pickCard.id <= 32) selectCard = pickCard;
      if (attribute === "def" && pickCard.id >= 33 && pickCard.id <= 49) selectCard = pickCard;
      if (attribute === "sup" && pickCard.id >= 50) selectCard = pickCard;
    } else {
      let pickCard = structuredClone(allCards[Math.floor(Math.random() * allCards.length)]);
      if (hand.value.find((card) => card.id === pickCard.id)) continue;
      if (offer.value.find((card) => card.id === pickCard.id)) continue;
      if (pickCard.id !== 0) selectCard = pickCard;
    }
  }
  return selectCard;
}
//cardをランダムに1枚引く//!最終Verでは属性のみにする
function drawRandomOneCard(order?: Attribute | number): void {
  const { player, id } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  if (hand.value.length >= 9) return;
  if (typeof order === "number") {
    hand.value.push(structuredClone(allCards[order]));
  } else {
    hand.value.push(drawCard(order));
  }
  hand.value = hand.value.slice().sort((a, b) => a.id - b.id);
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
}
//cardをランダムに3枚引く
async function draw2ExchangedCard() {
  console.log(i, "draw3ExchangedCardを実行しました");
  const { id, player, log } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  let selectCards: Card[] = [];
  for (let i = 0; i < 2; i++) {
    if (hand.value.length >= 9) return;
    let selectCard = drawCard();
    selectCard.waste = 7;
    selectCard.hungry = 0;
    selectCards[i] = selectCard;
    hand.value.push(selectCard);
    hand.value = [...hand.value].sort((a, b) => a.id - b.id);
  }
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
  console.log("draw3ExchangedCard: " + selectCards.map((card) => card.name));
}
//cardをHandに6枚セットする
async function setHand(): Promise<void> {
  console.log(i, "setHandを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  for (let i = 0; i < 6; i++) {
    if (hand.value.length >= 9) {
      console.log(i, "hand is full");
      return;
    } else {
      hand.value.push(drawCard());
    }
    hand.value = hand.value.slice().sort((a, b) => a.id - b.id);
  }
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
}
//Cardを3枚提示する
async function setOffer(): Promise<void> {
  console.log(i, "setOfferを実行しました");
  const { offer } = storeToRefs(playerStore);

  offer.value = [];
  for (let i = 0; i < 3; i++) {
    offer.value.push(drawCard());
    offer.value = offer.value.slice().sort((a, b) => a.id - b.id);
  }
}
//Handをすべて入れ替える
async function changeAllHand(): Promise<void> {
  console.log(i, "changeAllHandを実行しました");
  const { id, player, log } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  const num = hand.value.length;
  hand.value = [];
  for (let i = 0; i < num; i++) {
    hand.value.push(drawCard());
  }
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
  log.value = "changeAllHand: " + hand.value.map((card) => card.name);
}
//missionを3つセットする
async function setMissions(): Promise<void> {
  console.log(i, "setMissionsを実行しました");
  const { player, sign } = storeToRefs(playerStore);
  const { idGame } = toRefs(player.value);
  const { game, missions } = storeToRefs(gameStore);
  const { missionsNum } = toRefs(game.value);

  const copyAllMissions = _cloneDeep(allMissions);
  const oldMissions = missions.value;
  if (!sign.value) {
    missions.value = [];
    for (let i = 0; i < 3; i++) {
      const selectMission = Math.floor(Math.random() * allMissions.length);
      missionsNum.value[i] = selectMission;
      //同じmissionがセットされないようにする
      for (let j = 0; j < i; j++) {
        if (copyAllMissions[missionsNum.value[i]].id === copyAllMissions[missionsNum.value[j]].id) {
          i--;
          missions.value?.pop();
          break;
        }
      }
    }
    updateDoc(doc(gamesRef, idGame.value), { missionsNum: missionsNum.value });
    missions.value = [...missionsNum.value.map((num) => copyAllMissions[num])];
    console.log(
      i,
      missionsNum.value.map((num) => copyAllMissions[num].name)
    );
    updateDoc(doc(gamesRef, idGame.value), { firstAtkPlayer: deleteField() });
  } else {
    console.log(i, "ミッションを監視します");
    const unsubscribe = onSnapshot(doc(gamesRef, idGame.value), (snap) => {
      const updateMissionsNum = snap.data()?.missionsNum as number[] | undefined;
      const updateMissions = updateMissionsNum?.map((num) => copyAllMissions[num]);
      if (!updateMissionsNum) return;
      if (
        _isEqual(
          oldMissions?.map((mission) => mission.id),
          updateMissions?.map((mission) => mission.id)
        )
      )
        return;
      missionsNum.value = updateMissionsNum;
      missions.value = updateMissions;
      console.log(
        i,
        updateMissions?.map((mission) => mission.name)
      );
      //監視を解除する
      unsubscribe();
      console.log(i, "missionsの監視を解除しました");
    });
  }
}
//SumCardsの値を変更する
function changeSumCardsValue(key: keyof SumCards, value: number): void {
  console.log(i, "changeSumCardsValueを実行しました");
  const { sumCards } = storeToRefs(playerStore);

  sumCards.value[key] += value;
}
//Handの値を変更する
function changeHandValue(key: keyof SumCards, value: number, attribute?: Attribute): void {
  console.log(i, "changeHandValueを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  if (hand.value) {
    hand.value.forEach((card) => {
      if (card && (!attribute || card.attribute === attribute)) {
        const test = (card[key] += value);
        if (test < 0) card[key] = 0;
      }
    });
  }

  updateDoc(doc(playersRef, id.value), { hand: hand.value });
}
//Handの腐ったカードを削除する
function deleteAllRottenCard(): number {
  console.log(i, "deleteAllRottenCardを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { rottenHand } = toRefs(player.value);

  let num = rottenHand.value.length;
  rottenHand.value = [];
  updateDoc(doc(playersRef, id.value), { rottenHand: [] });
  return num;
}
//Statusの値を変更する
function changeStatusValue(key: keyof Status, value: number, isBreak?: boolean): void {
  console.log(i, "changeStatusValueを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { status } = toRefs(player.value);

  status.value[key] += value;
  if (key === "hp" && status.value.hp > status.value.maxHp && !isBreak) status.value.hp = status.value.maxHp;
  if (key === "hungry" && status.value.hungry < 0 && !isBreak) status.value.hungry = 0;
  if (key === "maxHp" && status.value.maxHp > 500 && !isBreak) status.value.maxHp = 500;
  if (key === "maxHungry" && status.value.maxHungry > 200 && !isBreak) status.value.maxHungry = 200;
  updateDoc(doc(playersRef, id.value), { status: status.value });
  console.log(i, "changeStatusValue: ", key, status.value[key]);
}
export {
  drawRandomOneCard,
  draw2ExchangedCard,
  setHand,
  setOffer,
  changeAllHand,
  setMissions,
  changeSumCardsValue,
  changeHandValue,
  deleteAllRottenCard,
  changeStatusValue,
};
