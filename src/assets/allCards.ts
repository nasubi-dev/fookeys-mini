import type { Card } from "@/types";

const allCards: Card[] = [
  {
    "id": 0,
    "name": "腐ったカード",
    "waste": 0,
    "hungry": 0,
    "company": "nothing",
    "rotten": true,
  },
  {
    "id": 1,
    "name": "改造プロテイン",
    "waste": 3,
    "hungry": 30,
    "company": "unlimit",
    "attribute": "atk",
    "description": "自分の手札にあるすべてのマッスルカードのマッスルダメージを💪+20する。",
    "atk": 10
  },
  {
    "id": 2,
    "name": "マカロン",
    "waste": 4,
    "hungry": 20,
    "company": "rapidpot",
    "attribute": "atk",
    "atk": 15
  },
  {
    "id": 3,
    "name": "タコス",
    "waste": 3,
    "hungry": 20,
    "company": "galdaybee",
    "attribute": "atk",
    "description": "後攻のとき、このカードのマッスルダメージは💪0になる。",
    "atk": 50
  },
  {
    "id": 4,
    "name": "ドーナツ",
    "waste": 3,
    "hungry": 25,
    "company": "rapidpot",
    "attribute": "atk",
    "atk": 30
  },
  {
    "id": 5,
    "name": "ピザ",
    "waste": 2,
    "hungry": 25,
    "company": "galdaybee",
    "attribute": "atk",
    "description": "相手の満腹度が🍖70以上のとき、このカードのマッスルダメージを💪+15する。",
    "atk": 30
  },
  {
    "id": 6,
    "name": "ステーキ",
    "waste": 3,
    "hungry": 30,
    "company": "galdaybee",
    "attribute": "atk",
    "description": "1枚だけで使用したとき、このカードのマッスルダメージを💪+20する。",
    "atk": 30
  },
  {
    "id": 7,
    "name": "モンブラン",
    "waste": 3,
    "hungry": 30,
    "company": "rapidpot",
    "attribute": "atk",
    "description": "ラウンド終了時にこのカードが手札にあるとき、手札にあるカードの満腹度を🍖-5する。",
    "atk": 40
  },
  {
    "id": 8,
    "name": "ホットドック",
    "waste": 4,
    "hungry": 35,
    "company": "galdaybee",
    "attribute": "atk",
    "atk": 45
  },
  {
    "id": 9,
    "name": "ハンバーガー",
    "waste": 3,
    "hungry": 35,
    "company": "galdaybee",
    "attribute": "atk",
    "description": "このカードがセールカードのとき、このカードの満腹度を🍖-10する。",
    "atk": 45
  },
  {
    "id": 10,
    "name": "ティラミス",
    "waste": 3,
    "hungry": 35,
    "company": "rapidpot",
    "attribute": "atk",
    "atk": 50
  },
  {
    "id": 11,
    "name": "パンケーキ",
    "waste": 3,
    "hungry": 40,
    "company": "rapidpot",
    "attribute": "atk",
    "atk": 60
  },
  {
    "id": 12,
    "name": "ローストターキー",
    "waste": 3,
    "hungry": 60,
    "company": "galdaybee",
    "attribute": "atk",
    "atk": 110
  },
  {
    "id": 13,
    "name": "ワッフル",
    "waste": 4,
    "hungry": 10,
    "company": "rapidpot",
    "attribute": "def",
    "def": 15
  },
  {
    "id": 14,
    "name": "改造チョコバナナ",
    "waste": 3,
    "hungry": 10,
    "company": "unlimit",
    "attribute": "def",
    "description": "このカードが手札にあるとき、ラウンド開始時に自分のシールドを🛡️+30する。",
    "def": 30
  },
  {
    "id": 15,
    "name": "焼き芋",
    "waste": 2,
    "hungry": 15,
    "company": "norma",
    "attribute": "def",
    "description": "unlimitのカードと同時に使用したとき、必ず先制する。",
    "def": 15
  },
  {
    "id": 16,
    "name": "プリン",
    "waste": 3,
    "hungry": 15,
    "company": "rapidpot",
    "attribute": "def",
    "description": "未定未定未定未定未定未定未定未定",
    "def": 30
  },
  {
    "id": 17,
    "name": "りんご飴",
    "waste": 3,
    "hungry": 20,
    "company": "norma",
    "attribute": "def",
    "description": "自分の手札にあるりんご飴の数だけ、このカードの満腹度を🍖-5する。",
    "def": 25
  },
  {
    "id": 18,
    "name": "クレープ",
    "waste": 3,
    "hungry": 20,
    "company": "rapidpot",
    "attribute": "def",
    "def": 40
  },
  {
    "id": 19,
    "name": "ラムネ",
    "waste": 4,
    "hungry": 25,
    "company": "norma",
    "attribute": "def",
    "description": "後攻のとき、このカードの満腹度は🍖0になる。",
    "def": 30
  },
  {
    "id": 20,
    "name": "アップルパイ",
    "waste": 3,
    "hungry": 25,
    "company": "rapidpot",
    "attribute": "def",
    "def": 50
  },
  {
    "id": 21,
    "name": "イカ焼き",
    "waste": 2,
    "hungry": 30,
    "company": "norma",
    "attribute": "def",
    "description": "このカードがセールカードのとき、このカードの満腹度を🍖-10する。",
    "def": 55
  },
  {
    "id": 22,
    "name": "フルーツタルト",
    "waste": 3,
    "hungry": 30,
    "company": "rapidpot",
    "attribute": "def",
    "def": 60
  },
  {
    "id": 23,
    "name": "大福",
    "waste": 4,
    "hungry": 10,
    "company": "hanamie",
    "attribute": "sup",
    "description": "自分の手札にあるカードの消費期限を🦠+1する。"
  },
  {
    "id": 24,
    "name": "改造ようかん",
    "waste": 3,
    "hungry": 10,
    "company": "unlimit",
    "attribute": "sup",
    "description": "ランダムなギフトを3つ発動する。"
  },
  {
    "id": 25,
    "name": "八つ橋",
    "waste": 3,
    "hungry": 15,
    "company": "hanamie",
    "attribute": "sup",
    "description": "次のラウンド、お互いのドローカードがすべてセールカードになる。"
  },
  {
    "id": 26,
    "name": "抹茶",
    "waste": 2,
    "hungry": 20,
    "company": "hanamie",
    "attribute": "sup",
    "description": "自分の手札にある腐ったカード以外のカードをすべて戻し、ランダムなカードを3枚ドローする。"
  },
  {
    "id": 27,
    "name": "茶碗蒸し",
    "waste": 4,
    "hungry": 30,
    "company": "hanamie",
    "attribute": "heal",
    "description": "自分のHPを❤️+50する。",
    "heal": 50
  }
]
export default allCards;
