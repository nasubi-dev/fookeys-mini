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
import allCards from "@/assets/allCards";
import { BATTLE_CONSTANTS, SALE_RATE } from "@/consts";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

//cardをランダムに1枚引く
function drawCard(attribute?: Attribute, isSale?: boolean): Card {
  const { player, offer } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  let selectCard;
  while (!selectCard) {
    if (attribute) {
      const pickCard = structuredClone(allCards[Math.floor(Math.random() * allCards.length)]);
      //すでに同じカードがある場合は引き直す
      if (hand.value.find((card) => card.id === pickCard.id)) continue;
      if (offer.value.find((card) => card.id === pickCard.id)) continue;
    } else {
      let pickCard = structuredClone(allCards[Math.floor(Math.random() * allCards.length)]);
      if (hand.value.find((card) => card.id === pickCard.id)) continue;
      if (offer.value.find((card) => card.id === pickCard.id)) continue;
      if (pickCard.id !== 0) selectCard = pickCard;
    }
  }
  // 確率でセールカードにする
  if (isSale === undefined) {
    if (Math.random() < SALE_RATE) {
      if (selectCard.id === 21 || selectCard.id === 9) selectCard.hungry -= 10;
      selectCard.waste = 1;
      selectCard.isSale = true;
    }
  } else if (isSale) {
    if (selectCard.id === 21 || selectCard.id === 9) selectCard.hungry -= 10;
    selectCard.waste = 1;
    selectCard.isSale = true;
  }
  return selectCard;
}
// カードを一枚引く
function drawOneCard(order?: Attribute | number | null, isSale?: boolean): void {
  const { player, id } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  if (hand.value.length >= 5) return;
  if (typeof order === "number") {
    hand.value.push(structuredClone(allCards[order]));
  } else if (typeof order === "string") {
    hand.value.push(drawCard(order, isSale));
  } else {
    hand.value.push(drawCard(undefined, isSale));
  }
  hand.value = hand.value.slice().sort((a, b) => a.id - b.id);
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
}
async function drawChangedCard(values: [{ key: keyof SumCards; value: number }]): Promise<void> {
  console.log(i, "drawChangedCardを実行しました");
  const { id, player, log } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  if (hand.value.length >= BATTLE_CONSTANTS.MAX_HAND_SIZE) return;
  let selectCard = drawCard();
  values.forEach((value) => {
    selectCard[value.key] = value.value;
  });
  hand.value.push(selectCard);
  hand.value = [...hand.value].sort((a, b) => a.id - b.id);

  updateDoc(doc(playersRef, id.value), { hand: hand.value });
}
//cardをHandに3枚セットする
async function setHand(): Promise<void> {
  console.log(i, "setHandを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  while (hand.value.length < BATTLE_CONSTANTS.START__HAND_SIZE) {
    if (hand.value.length >= BATTLE_CONSTANTS.MAX_HAND_SIZE) {
      console.log(i, "hand is full");
      return;
    } else {
      let selectCard = drawCard();
      //セールカードはHandに入れない
      if (selectCard.isSale) continue;
      hand.value.push(selectCard);
    }
    hand.value = hand.value.slice().sort((a, b) => a.id - b.id);
  }
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
}
//Cardを3枚提示する
async function setOffer(): Promise<void> {
  console.log(i, "setOfferを実行しました");
  const { player } = storeToRefs(playerStore);
  const { isShopSale } = toRefs(player.value);
  const { offer } = storeToRefs(playerStore);

  offer.value = [];
  for (let i = 0; i < BATTLE_CONSTANTS.SHOP_OFFER_COUNT; i++) {
    let card = drawCard();
    //isShopSaleがtrueなら、セールカードのみを表示
    if (isShopSale.value && !card.isSale) {
      i--;
      continue;
    }
    offer.value.push(card);
    offer.value = offer.value.slice().sort((a, b) => a.id - b.id);
  }
  isShopSale.value = false;
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
// Handから普通のカードを削除する
function deleteAllCard(): void {
  console.log(i, "deleteAllCardを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { hand } = toRefs(player.value);

  hand.value = hand.value.filter((card) => card.id === 0);
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
}
//Statusの値を変更する
function changeStatusValue(key: keyof Status, value: number, isBreak?: boolean): void {
  console.log(i, "changeStatusValueを実行しました");
  const { id, player } = storeToRefs(playerStore);
  const { status } = toRefs(player.value);

  status.value[key] += value;
  if (key === "hp" && status.value.hp > status.value.maxHp && !isBreak) status.value.hp = status.value.maxHp;
  if (key === "hungry" && status.value.hungry < 0 && !isBreak) status.value.hungry = 0;
  if (key === "maxHp" && status.value.maxHp > 300 && !isBreak) status.value.maxHp = 300;
  if (key === "maxHungry" && status.value.maxHungry > 200 && !isBreak) status.value.maxHungry = 200;
  updateDoc(doc(playersRef, id.value), { status: status.value });
  console.log(i, "changeStatusValue: ", key, status.value[key]);
}
export {
  drawOneCard,
  drawChangedCard,
  setHand,
  setOffer,
  changeAllHand,
  changeSumCardsValue,
  changeHandValue,
  deleteAllCard,
  changeStatusValue,
};
