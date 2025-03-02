type Attribute = "atk" | "def" | "tech" | "sup" | "heal";
type Card = {
  id: number;
  name: string;
  waste: number;
  hungry: number;
  company: string;
  attribute?: Attribute;
  description?: string;
  priority?: number;
  atk?: number;
  def?: number;
  tech?: number;
  heal?: number;
  rotten?: boolean; //腐ってるかのフラグ
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
  initialContribution?: number;
  passive?: () => void;
};

type Gift = {
  id: number;
  name: string;
  description: string;
  requireContribution: number;
  skill: () => void;
};

type Mission = {
  id: number;
  name: string;
  achieved: boolean;
  description: string;
  reward: number;
  goalAchievement: number;
  nowAchievement: number;
  checker?: (donate?: boolean, sumFields?: SumCards, field?: Card[], hand?: Card[]) => number | undefined;
};
//!使われてるか調べる
type Phase = "shop" | "battle" | "result" | "none";
type MatchStatus = "matching" | "nothing" | "waiting" | "battle";
type PlayerSign = 0 | 1;
type Status = { hp: number; hungry: number; contribution: number; maxHp: number; maxHungry: number };
type SumCards = { waste: number; hungry: number; priority: number; atk: number; def: number; tech: number; heal: number };
type PlayerData = {
  idEnemy: string;
  idGame: string;
  name: string;
  check: boolean;
  death: boolean;
  donate: boolean;
  match: MatchStatus;
  password: string;
  character: string;
  gifts: number[];
  isSelectedGift: number | undefined;
  hand: Card[];
  rottenHand: Card[];
  field: Card[];
  status: Status;
  sumFields: SumCards;
};

type GameData = {
  turn: number;
  players: string[];
  missionsNum: number[];
  firstAtkPlayer: PlayerSign | undefined;
};

export type { Attribute, Card, Character, Gift, Mission, Phase, MatchStatus, PlayerSign, Status, PlayerData, SumCards, GameData };
