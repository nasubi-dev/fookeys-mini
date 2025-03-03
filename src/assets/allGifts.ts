import { e, s, i } from "@/log";
import type { Gift } from "@/types";
import {
  changeAllHand,
  changeHandValue,
  changeStatusValue,
  setHand,
  deleteAllRottenCard,
  changeSumCardsValue,
} from "@/server/useShopUtils";

const allGifts: Gift[] = [
  {
    id: 0,
    name: "マジック",
    description: "手札を全て入れ替える",
    skill: () => {
      changeAllHand();
    },
  },
  {
    id: 1,
    name: "つまみ食い",
    description: "手札のカードの満腹度を🍖-20する",
    skill: () => {
      changeHandValue("hungry", -20);
    },
  },
  {
    id: 2,
    name: "飯テロ",
    description: "このラウンド中相手はマッスルカードしか使えない",
    skill: () => {},
  },
  {
    id: 3,
    name: "冷凍保存",
    description: "手札の消費期限を🦠+2する",
    skill: () => {
      changeHandValue("waste", 2);
    },
  },
  {
    id: 4,
    name: "ドクターストップ",
    description: "このラウンド中相手は1枚しかカードを使用できない",
    skill: () => {},
  },
  {
    id: 5,
    name: "リサイクル",
    description: "腐ったカードを手札から全部消す",
    skill: () => {
      const num = deleteAllRottenCard();
      changeStatusValue("maxHungry", num * 20);
    },
  },
  {
    id: 6,
    name: "栄養バランス",
    description: "HPを❤️+150する",
    skill: () => {
      changeStatusValue("hp", 150);
    },
  },
  {
    id: 7,
    name: "リサーチ",
    description: "自身の満腹度を🍖-100する",
    skill: () => {
      changeStatusValue("hungry", -100);
    },
  },
  {
    id: 8,
    name: "筋トレ",
    description: "このラウンド中マッスルダメージを2倍にする",
    skill: () => {},
  },
  {
    id: 9,
    name: "おなべのふた",
    description: "このラウンド中使用カード枚数分防御を🛡+100する",
    skill: () => {
      changeSumCardsValue("def", 100);
    },
  },
  {
    id: 10,
    name: "福袋",
    description: "カードを6枚ドローする",
    skill: () => {
      setHand();
    },
  },
  {
    id: 11,
    name: "早食い",
    description: "このラウンド中使用カード枚数分スピードを🦶+1する",
    skill: () => {
    },
  },
];
export default allGifts;
