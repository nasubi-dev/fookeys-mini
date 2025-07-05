// ギフトパックのポイント定数
const GIFT_POINTS = {
  NORMAL_CARD: 5,
  SALE_CARD: 15,
  THREE_COMPANIES: 20,
  EMPTY_HAND: 30,
  UNIQUE_COMPANIES: 10,
  ROTTEN_CARD_PENALTY: 50,
  HAVE_ROTTEN_PENALTY: 10,
} as const;

// 特殊効果を持つカードのID
const SPECIAL_ATK_CARD_IDS = [1, 3, 5, 6, 7, 9] as const;
const SPECIAL_DEF_CARD_IDS = [14, 15, 17, 19, 21] as const;
const SPECIAL_SUP_CARD_IDS = [23, 24, 25, 26] as const;
const SPECIAL_CARD_IDS = [...SPECIAL_ATK_CARD_IDS, ...SPECIAL_DEF_CARD_IDS, ...SPECIAL_SUP_CARD_IDS] as const;

// postBattle関連の定数
const POST_BATTLE_CONSTANTS = {
  WASTE_REDUCTION: 1,
  HUNGRY_REDUCTION: 30,
} as const;

// セールカードの確率
const SALE_RATE = 0.3;

// 戦闘関連の定数
const BATTLE_CONSTANTS = {
  // 会社数の閾値
  UNIQUE_COMPANIES_THRESHOLD: 3,

  // ギフトパックのゲージ最大値
  GIFT_PACK_GAUGE_MAX: 100,

  // 待機時間（ミリ秒）
  WAIT_TIME: {
    STANDARD: 1000,
    SHORT: 500,
    VERY_SHORT: 100,
    BATTLE_PHASE: 1500,
    TURN_ANIMATION: 1000,
    BATTLE_ANIMATION: 1700,
    DEATH_ANIMATION: 1200,
    SHOP_DELAY: 2000,
  },

  // ショップに並ぶカードの数
  SHOP_OFFER_COUNT: 3,

  // 手札制限
  MAX_HAND_SIZE: 5,

  // 手札の初期枚数
  START__HAND_SIZE: 3,

  // 戦闘フェーズ
  PRIMARY: "primary",
  SECOND: "second",

  // プレイヤーの順番
  PLAYER_ALLOCATION: {
    SECOND: 0,
    FIRST: 1,
  },
} as const;

// ログメッセージ定数
const LOG_MESSAGES = {
  CARD_USED: (count: number, points: number) => `カードを${count}枚使用したので${points}pt獲得した！`,
  SALE_CARD_USED: (count: number, points: number) => `セールカードを${count}枚使用したので${points}pt獲得した！`,
  THREE_COMPANIES_USED: (company: number, points: number) => `手札に会社カードが${company}枚あるので、ギフトパックを${points}pt獲得した！`,
  EMPTY_HAND_BONUS: (points: number) => `手札が0枚になったので、ギフトパックを${points}pt獲得した！`,
  UNIQUE_COMPANIES_BONUS: (points: number) => `手札に同じ会社のカードがないので、ギフトパックを${points}pt獲得した！`,
  ROTTEN_CARD_PENALTY: (count: number, points: number) => `カードを${count}枚腐らせたので${points}pt失った！`,
  HAVE_ROTTEN_PENALTY: (count: number, points: number) => `${count}枚の腐ったカードを持っているので、ギフトパックを${points}ptを失った！`,
} as const;

export {
  GIFT_POINTS,
  SPECIAL_CARD_IDS,
  SALE_RATE,
  POST_BATTLE_CONSTANTS,
  BATTLE_CONSTANTS,
  LOG_MESSAGES,
  SPECIAL_ATK_CARD_IDS,
  SPECIAL_DEF_CARD_IDS,
  SPECIAL_SUP_CARD_IDS,
};
