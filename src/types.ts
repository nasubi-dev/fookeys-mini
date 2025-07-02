type Attribute = "atk" | "def" | "tech" | "sup" | "heal";
type Card = {
  id: number;
  name: string;
  waste: number;
  hungry: number;
  company: string;
  attribute?: Attribute;
  description?: string;
  atk?: number;
  def?: number;
  tech?: number;
  heal?: number;
  rotten?: boolean; //腐ってるかのフラグ
  isSale?: boolean;
};

type Character = {
  id: number;
  name: string;
  description1?: string;
  description2?: string;
  description3?: string;
  company: string;
  maxHungry?: number;
  maxHp?: number;
  passive?: () => void;
};

type Gift = {
  id: number;
  name: string;
  description: string;
  effect: () => void;
};

//!使われてるか調べる
type Phase = "shop" | "battle" | "result" | "giftPack" | "none";
type MatchStatus = "matching" | "nothing" | "waiting" | "battle";
type PlayerSign = 0 | 1;
type Status = { hp: number; hungry: number; maxHp: number; maxHungry: number };
type SumCards = { waste: number; hungry: number; atk: number; def: number; tech: number; heal: number };
type PlayerData = {
  idEnemy: string;
  idGame: string;
  name: string;
  check: boolean;
  death: boolean;
  match: MatchStatus;
  password: string;
  character: string;
  giftActiveId: number;
  giftPackGauge: number;
  giftPackTotal: number;
  giftPackCounter: {
    giftActiveCount: number;
    usedCard: number;
    usedSaleCard: number;
    used3CompanyCard: number;
    rottenCard: number;
    haveRottenCard: number;
    haveNotSameCompanyCard: number;
    hand0Card: number;
  };
  hand: Card[];
  rottenHand: Card[];
  isTrash: boolean;
  field: Card[];
  status: Status;
  sumFields: SumCards;
};

type GameData = {
  turn: number;
  players: string[];
  firstAtkPlayer: PlayerSign | undefined;
};

export type { Attribute, Card, Character, Gift, Phase, MatchStatus, PlayerSign, Status, PlayerData, SumCards, GameData };
