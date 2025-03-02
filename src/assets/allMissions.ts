import type { Mission } from "@/types";
//!同じIDであれば、ミッションは同じものとして扱う ただし､内容は異なる
const allMissions: Mission[] = [
  {
    id: 0,
    name: "食べ盛り★",
    achieved: false,
    description: "合計🍖400分のカードを使用する。",
    reward: 35,
    goalAchievement: 400,
    nowAchievement: 0,
    checker: (donate, sumFields) => {
      if (donate) return;
      if (sumFields === undefined) return;
      return sumFields.hungry;
    },
  },
  {
    id: 0,
    name: "食べ盛り★★",
    achieved: false,
    description: "合計🍖500分のカードを使用する。",
    reward: 40,
    goalAchievement: 500,
    nowAchievement: 0,
    checker: (donate, sumFields) => {
      if (donate) return;
      if (sumFields === undefined) return;
      return sumFields.hungry;
    },
  },
  {
    id: 1,
    name: "マーケティングhanamie★",
    achieved: false,
    description: "hanamieのカードを合計3枚使用する。",
    reward: 40,
    goalAchievement: 3,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "hanamie").length;
    },
  },
  {
    id: 1,
    name: "マーケティングhanamie★★",
    achieved: false,
    description: "hanamieのカードを合計5枚使用する。",
    reward: 50,
    goalAchievement: 5,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "hanamie").length;
    },
  },
  {
    id: 2,
    name: "マーケティングnorma★",
    achieved: false,
    description: "normaのカードを合計3枚使用する。",
    reward: 40,
    goalAchievement: 3,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "norma").length;
    },
  },
  {
    id: 2,
    name: "マーケティングnorma★★",
    achieved: false,
    description: "normaのカードを合計5枚使用する。",
    reward: 50,
    goalAchievement: 5,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "norma").length;
    },
  },
  {
    id: 3,
    name: "マーケティングbianca★",
    achieved: false,
    description: "biancaのカードを合計3枚使用する。",
    reward: 40,
    goalAchievement: 3,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "bianca").length;
    },
  },
  {
    id: 3,
    name: "マーケティングbianca★★",
    achieved: false,
    description: "biancaのカードを合計5枚使用する。",
    reward: 50,
    goalAchievement: 5,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "bianca").length;
    },
  },
  {
    id: 4,
    name: "マーケティングgaldaybee★",
    achieved: false,
    description: "galdaybeeのカードを合計3枚使用する。",
    reward: 40,
    goalAchievement: 3,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "galdaybee").length;
    },
  },
  {
    id: 4,
    name: "マーケティングgaldaybee★★",
    achieved: false,
    description: "galdaybeeのカードを合計5枚使用する。",
    reward: 50,
    goalAchievement: 5,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "galdaybee").length;
    },
  },
  {
    id: 5,
    name: "マーケティングrapidpot★",
    achieved: false,
    description: "rapidpotのカードを合計3枚使用する。",
    reward: 40,
    goalAchievement: 3,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "rapidpot").length;
    },
  },
  {
    id: 5,
    name: "マーケティングrapidpot★★",
    achieved: false,
    description: "rapidpotのカードを合計5枚使用する。",
    reward: 50,
    goalAchievement: 5,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "rapidpot").length;
    },
  },
  {
    id: 6,
    name: "マーケティングunlimit★",
    achieved: false,
    description: "unlimitのカードを合計2枚使用する。",
    reward: 40,
    goalAchievement: 2,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "unlimit").length;
    },
  },
  {
    id: 6,
    name: "マーケティングunlimit★★",
    achieved: false,
    description: "unlimitのカードを合計4枚使用する。",
    reward: 50,
    goalAchievement: 4,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.company === "unlimit").length;
    },
  },
  {
    id: 7,
    name: "セール品★",
    achieved: false,
    description: "消費期限が🦠3以下のカードを4枚以上使用する。",
    reward: 45,
    goalAchievement: 4,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.waste <= 3).length;
    },
  },
  {
    id: 7,
    name: "セール品★★",
    achieved: false,
    description: "消費期限が🦠3以下のカードを7枚以上使用する。",
    reward: 55,
    goalAchievement: 7,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      return field.filter((card) => card.waste <= 3).length;
    },
  },
  {
    id: 8,
    name: "食べきり",
    achieved: false,
    description: "カードを使用して手札を0枚にする",
    reward: 45,
    goalAchievement: 1,
    nowAchievement: 0,
    checker: (donate, sumFields, field, hand) => {
      if (donate) return;
      if (hand === undefined) return;
      return hand.length === 0 ? 1 : 0;
    },
  },
  {
    id: 9,
    name: "買い物メモ",
    achieved: false,
    description: "自身の行動後、同じ会社のカードを持たない。",
    reward: 25,
    goalAchievement: 1,
    nowAchievement: 0,
    checker: (donate, sumFields, field, hand) => {
      if (donate) return;
      const ids = hand?.map((card) => card.attribute);
      const uniqueIds = Array.from(new Set(ids));
      return uniqueIds.length === ids?.length ? 1 : 0;
    },
  },
  {
    id: 10,
    name: "余り物レシピ",
    achieved: false,
    description: "1ラウンドで3社以上のカードを使用する。",
    reward: 40,
    goalAchievement: 1,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (donate) return;
      if (field === undefined) return;
      const ids = field.map((card) => card.company);
      const uniqueIds = [...new Set(ids)];
      return uniqueIds.length >= 3 ? 1 : 0;
    },
  },
  {
    id: 11,
    name: " 寄付★",
    achieved: false,
    description: "フードバンクに5枚以上寄付する。",
    reward: 30,
    goalAchievement: 5,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (field === undefined) return;
      if (!donate) return;
      return field.length;
    },
  },
  {
    id: 11,
    name: " 寄付★★",
    achieved: false,
    description: "フードバンクに8枚以上寄付する。",
    reward: 40,
    goalAchievement: 8,
    nowAchievement: 0,
    checker: (donate, sumFields, field) => {
      if (field === undefined) return;
      if (!donate) return;
      return field.length;
    },
  },
];
export default allMissions;
