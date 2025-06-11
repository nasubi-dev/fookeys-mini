// 定数定義
const GIFT_PACK_POINTS = {
  NORMAL_CARD: 5,
  SALE_CARD: 15,
  THREE_COMPANIES: 20,
} as const;

// 特殊効果を持つカードのID
const SPECIAL_CARD_IDS = [7, 24, 41, 50, 51, 52, 53, 60] as const;

export { GIFT_PACK_POINTS, SPECIAL_CARD_IDS };