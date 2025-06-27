import { e, s, i } from "@/log";
import type { Gift } from "@/types";
import { changeHandValue, changeStatusValue, drawChangedCard } from "@/server/useShopUtils";

const allGifts: Gift[] = [
  {
    id: 0,
    name: "栄養バランス",
    description: "自分のHPを❤️+50回復する。",
    effect: () => changeStatusValue("hp", 50),
  },
  {
    id: 1,
    name: "リサーチ",
    description: "自分の満腹度を🍖-25する。",
    effect: () => changeStatusValue("hungry", -25),
  },
  {
    id: 2,
    name: "冷凍保存",
    description: "自分の手札にあるカードの消費期限を🦠+1する。",
    effect: () => changeHandValue("waste", -1),
  },
  {
    id: 3,
    name: "つまみ食い",
    description: "自分の手札にあるカードの満腹度を🍖-10する。",
    effect: () => changeHandValue("hungry", -10),
  },
  {
    id: 4,
    name: "早食い",
    description: "次のラウンドで必ず先行になる。",
    effect: () => {},
  },
  {
    id: 5,
    name: "筋トレ",
    description: "次のラウンド開始時、自分のマッスルダメージを💪+30する。",
    effect: () => {},
  },
  {
    id: 6,
    name: "おなべのふた",
    description: "次のラウンド開始時、自分のシールドを🛡️+40する。",
    effect: () => {},
  },
  {
    id: 7,
    name: "福袋",
    description: "ラウンド終了時、満腹度を🍖0で固定したランダムなカードを1枚ドローする。",
    effect: () => drawChangedCard([{ key: "hungry", value: 0 }]),
  },
];

export default allGifts;
