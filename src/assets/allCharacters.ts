import type { Character } from "@/types";
const allCharacters: Character[] = [
  {
    id: 0,
    name: "petit&spot",
    company: "rapidpot",
    description1: "最大満腹度を🍖+50する。",
    maxHungry: +50,
    description2: "ラウンド終了時の減少満腹度を追加で🍖-20する",
  },
  // {
  //   id: 1,
  //   name: "ミューゼ",
  //   company: "bulbull",
  //   description1: "ゲーム開始時に貢献度を🪙+100する。",
  //   initialContribution: 100,
  //   description2:"獲得貢献度を2倍にする｡",
  //   //?mission作成後に追加
  //   description3:"ギフトを使用したとき、カードを1枚ドローする",
  // },
  // {
  //   id: 2,
  //   name: "ユウダチ",
  //   company: "hanamie",
  //   description1: "最大HPを❤️+300する｡",
  //   maxHp: +300,
  //   description2:"ミッションをクリアしたとき、HPを❤️+100する。",
  //   //?mission作成後に追加
  //   description3:"カードやギフトによる回復量を2倍にする。",
  // },
  {
    id: 3,
    name: "nabenabe",
    company: "norma",
    description1: "ギフトを使用したとき、シールドを🛡️+100する。",
    description2: "ラウンド開始時、自身の満腹度🍖10ごとにシールドを🛡+5する。",
    description3: "フードバンクに寄付したとき、シールドを🛡+寄付した枚数×50する。",
  },
  // {
  //   id: 4,
  //   name: "バルグ",
  //   company: "galdaybee",
  //   description1: "マッスルカードの出現率が2倍になる。",
  //   description2:"ラウンド終了時、手札のマッスルカードのマッスルダメージを💪+5する。",
  //   description3:"HPが❤️100以下のとき、与えるマッスルダメージを2倍にする。",
  // },
  {
    id: 5,
    name: "blankiss",
    company: "bianca",
    description1: "自身の所持カードの会社を相手に公開しない。",
    description2: "ミッションが配られたとき、ランダムな1つのミッションを自身しかクリアできないようにする。",
    //?mission作成後に追加
  },
  // {
  //   id: 6,
  //   name: "ガラガシャ",
  //   company: "unlimit",
  //   description1: "1ラウンドに1度までドローカードの再抽選ができる。",
  //   description2:"1ラウンドにカードを5枚以上使用したとき、スピードを🦶+1する。",
  // },
];
export default allCharacters;
