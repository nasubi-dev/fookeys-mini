import { computed, ref } from "vue";
import { i } from "@/log";
import { defineStore } from "pinia";
import type { Card, GameData, PlayerData, SumCards, Phase, PlayerSign } from "@/types";
import allCards from "@/assets/allCards";
import { decideGiftActive } from "@/server/useBattleUtils";

interface ModalConfig {
  id: string;
  title?: string;
  isOpen: boolean;
}

const useModalStore = defineStore("modal", () => {
  const modals = ref<ModalConfig[]>([]);

  const openModal = (id: string, title?: string) => {
    const existingModal = modals.value.find((modal) => modal.id === id);
    if (existingModal) {
      existingModal.isOpen = true;
      if (title) existingModal.title = title;
    } else {
      modals.value.push({ id, title, isOpen: true });
    }
  };

  const closeModal = (id: string) => {
    const modal = modals.value.find((modal) => modal.id === id);
    if (modal) {
      modal.isOpen = false;
    }
  };

  const closeAllModals = () => {
    modals.value.forEach((modal) => {
      modal.isOpen = false;
    });
  };

  const getModal = (id: string) => {
    return computed(() => modals.value.find((modal) => modal.id === id));
  };

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    getModal,
  };
});

const usePlayerStore = defineStore("playerData", () => {
  //?Const/State
  const id = ref("");
  const sign = ref<PlayerSign>(0);
  const player = ref<PlayerData>({
    idEnemy: "",
    idGame: "",
    name: "",
    check: false,
    death: false,
    match: "nothing",
    password: "",
    character: "blankiss",
    giftPackGauge: 0,
    giftActiveId: -1,
    giftPackTotal: 0,
    giftPackCounter: {
      giftActiveCount: 0,
      usedCard: 0,
      usedSaleCard: 0,
      used3CompanyCard: 0,
      rottenCard: 0,
      haveRottenCard: 0,
      haveNotSameCompanyCard: 0,
      hand0Card: 0,
    },
    giftActiveBeforeId: -1,
    hand: [],
    rottenHand: [],
    isTrash: false,
    isShopSale: false,
    isSaleZeroHungry: false,
    field: [],
    status: {
      hp: 300,
      hungry: 0,
      maxHp: 300,
      maxHungry: 100,
    },
    sumFields: {
      waste: 0,
      hungry: 0,
      atk: 0,
      def: 0,
      tech: 0,
      heal: 0,
    },
  });
  const phase = ref<Phase>("none");
  const cardLock = ref(false);
  const offer = ref<Card[]>([]);
  const log = ref<string>("");
  const myLog = ref<string>("");
  const enemyLog = ref<string>("");
  const components = ref<string>("postBattle");
  const battleResult = ref<(string | number)[]>(["none", 0]);
  const isMobile = ref(false);
  //?Computed/Getter
  //Fieldに出ているカードの値を合計する
  const sumCards = computed<SumCards>(() =>
    player.value.field.reduce(
      (sum: SumCards, card: Card) => {
        sum.waste += card.waste;
        sum.hungry += card.hungry;
        sum.atk += (card.atk ?? 0) * (player.value.field.map((card) => card.id).includes(64) ? 2 : 1);
        sum.def += card.def ?? 0;
        sum.tech += card.tech ?? 0;
        sum.heal += card.heal ?? 0;
        return sum;
      },
      {
        waste: 0,
        hungry: 0,
        atk: 0,
        def: 0,
        tech: 0,
        heal: 0,
      }
    )
  );
  //?function/actions
  //Handのカードをクリックしたら、そのカードをFieldに出す
  const pushHand = (index: number): void => {
    const { field, hand } = player.value;
    field.push(hand[index]);
  };
  //Fieldのカードをクリックしたら、そのカードをHandに戻す
  const popHand = (index: number, id: number): void => {
    const { field } = player.value;
    const cardIndex = field.findIndex((card) => card.id === id);
    if (cardIndex === -1) throw new Error("when popHard not found");
    field.splice(cardIndex, 1);
  };
  //ターン終了時に、Fieldのカードを捨てる
  const deleteField = (): void => {
    const { field } = player.value;
    field.splice(0, field.length);
    console.log(i, "fieldDelete");
  };
  //wasteが0のカードを腐らせる
  const checkRotten = (): void => {
    let { hand, rottenHand } = player.value;
    hand.forEach((card) => {
      if (card.waste === 0) {
        hand.splice(hand.indexOf(card), 1, allCards[0]);
      }
    });
    const num = hand.filter((card) => card.waste === 0).length;
    for (let i = 0; i < num; i++) {
      //handの中からallCards[0]を削除する
      hand.splice(hand.indexOf(allCards[0]), 1);
      //numの数だけrottenHandにallCards[0]をpushする
      rottenHand.push(allCards[0]);
    }
  };
  const checkGiftPackAchieved = (): void => {
    const { giftPackCounter } = player.value;
    let giftPackGauge = player.value.giftPackGauge;
    const maxGauge = 100;
    const minGauge = 0;
    while (giftPackGauge >= maxGauge) {
      giftPackCounter.giftActiveCount += 1;
      giftPackGauge -= maxGauge;
      player.value.giftActiveId = decideGiftActive();
    }
    if (giftPackGauge < minGauge) {
      giftPackGauge = minGauge;
    }
    player.value.giftPackGauge = giftPackGauge;
    player.value.giftPackTotal = giftPackCounter.giftActiveCount * 100 + giftPackGauge;
  };
  const $reset = () => {
    id.value = "";
    sign.value = 0;
    player.value = {
      idEnemy: "",
      idGame: "",
      name: "",
      check: false,
      death: false,
      match: "nothing",
      password: "",
      character: "blankiss",
      giftActiveId: -1,
      giftPackGauge: 0,
      giftPackTotal: 0,
      giftPackCounter: {
        giftActiveCount: 0,
        usedCard: 0,
        usedSaleCard: 0,
        used3CompanyCard: 0,
        rottenCard: 0,
        haveRottenCard: 0,
        haveNotSameCompanyCard: 0,
        hand0Card: 0,
      },
      giftActiveBeforeId: -1,
      hand: [],
      rottenHand: [],
      isTrash: false,
      isShopSale: false,
      isSaleZeroHungry: false,
      field: [],
      status: {
        hp:  300,
        hungry: 0,
        maxHp: 300,
        maxHungry: 100,
      },
      sumFields: {
        waste: 0,
        hungry: 0,
        atk: 0,
        def: 0,
        tech: 0,
        heal: 0,
      },
    };
    phase.value = "none";
    cardLock.value = false;
    offer.value = [];
    log.value = "";
    myLog.value = "";
    enemyLog.value = "";
    components.value = "postBattle";
    battleResult.value = ["none", 0];
    isMobile.value = false;
  };
  return {
    id,
    sign,
    player,
    phase,
    cardLock,
    offer,
    log,
    myLog,
    enemyLog,
    components,
    battleResult,
    sumCards,
    isMobile,
    pushHand,
    popHand,
    deleteField,
    checkRotten,
    checkGiftPackAchieved,
    $reset,
  };
});

const useEnemyPlayerStore = defineStore("enemyPlayerData", () => {
  //?Const/State
  const enemyPlayer = ref<PlayerData>({
    idEnemy: "",
    idGame: "",
    name: "",
    check: false,
    death: false,
    match: "nothing",
    password: "",
    character: "blankiss",
    giftPackGauge: 0,
    giftActiveId: -1,
    giftPackTotal: 0,
    giftPackCounter: {
      giftActiveCount: 0,
      usedCard: 0,
      usedSaleCard: 0,
      used3CompanyCard: 0,
      rottenCard: 0,
      haveRottenCard: 0,
      haveNotSameCompanyCard: 0,
      hand0Card: 0,
    },
    giftActiveBeforeId: -1,
    hand: [],
    rottenHand: [],
    isTrash: false,
    isShopSale: false,
    isSaleZeroHungry: false,
    field: [],
    status: {
      hp: 300,
      hungry: 0,
      maxHp: 300,
      maxHungry: 100,
    },
    sumFields: {
      waste: 0,
      hungry: 0,
      atk: 0,
      def: 0,
      tech: 0,
      heal: 0,
    },
  });
  //?Computed/Getter
  const enemyGiftPackTotalPoint = computed(() => {
    const maxGauge = 100;
    const minGauge = 0;
    // 100以上であるとき､100ずつ引く
    while (enemyPlayer.value.giftPackGauge >= maxGauge) {
      enemyPlayer.value.giftPackCounter.giftActiveCount += 1;
      enemyPlayer.value.giftPackGauge -= maxGauge;
    }
    // 0未満であるとき､0にする
    if (enemyPlayer.value.giftPackGauge < minGauge) {
      enemyPlayer.value.giftPackGauge = minGauge;
    }
    return enemyPlayer.value.giftPackCounter.giftActiveCount * 100 + enemyPlayer.value.giftPackGauge;
  });
  const $reset = () => {
    enemyPlayer.value = {
      idEnemy: "",
      idGame: "",
      name: "",
      check: false,
      death: false,
      match: "nothing",
      password: "",
      character: "blankiss",
      giftPackGauge: 0,
      giftActiveId: -1,
      giftPackTotal: 0,
      giftPackCounter: {
        giftActiveCount: 0,
        usedCard: 0,
        usedSaleCard: 0,
        used3CompanyCard: 0,
        rottenCard: 0,
        haveRottenCard: 0,
        haveNotSameCompanyCard: 0,
        hand0Card: 0,
      },
      giftActiveBeforeId: -1,
      hand: [],
      rottenHand: [],
      field: [],
      isTrash: false,
      isShopSale: false,
      isSaleZeroHungry: false,
      status: {
        hp: 300,
        hungry: 0,
        maxHp: 300,
        maxHungry: 100,
      },
      sumFields: {
        waste: 0,
        hungry: 0,
        atk: 0,
        def: 0,
        tech: 0,
        heal: 0,
      },
    };
  };
  return { enemyPlayer, enemyGiftPackTotalPoint, $reset };
});

const useGameStore = defineStore("gameData", () => {
  //?Const/State
  const game = ref<GameData>({
    turn: 1,
    players: [],
    firstAtkPlayer: undefined,
  });
  //?Computed/Getter
  ///?function/actions
  //ターン終了時に、turnを1増やす
  const nextTurn = (): void => {
    game.value.turn += 1;
    console.log(i, "turn: ", game.value.turn);
  };
  const $reset = () => {
    game.value = {
      turn: 1,
      players: [],
      firstAtkPlayer: undefined,
    };
  };

  return { game, nextTurn, $reset };
});

export { useGameStore, useEnemyPlayerStore, usePlayerStore, useModalStore };
