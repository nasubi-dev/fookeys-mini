import { toRefs } from "vue";
import { e, i, s } from "@/log";
import { enemyPlayerStore, gameStore, playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, doc, getDoc, increment, updateDoc } from "firebase/firestore";
import type { GameData, PlayerData, Card, SumCards, PlayerSign } from "@/types";
import { converter } from "@/server/converter";
import { intervalForEach, wait } from "@/server/utils";
import { syncPlayer, reflectStatus, checkDeath, everyUtil, decideFirstAtkPlayer, giftCheck } from "./useBattleUtils";
import { getEnemyPlayer } from "@/server/usePlayerData";
import { changeHandValue, changeStatusValue, deleteAllRottenCard, drawOneCard } from "@/server/useShopUtils";
import {
  GIFT_POINTS,
  SPECIAL_CARD_IDS,
  POST_BATTLE_CONSTANTS,
  BATTLE_CONSTANTS,
  LOG_MESSAGES,
  SPECIAL_ATK_CARD_IDS,
  SPECIAL_DEF_CARD_IDS,
  SPECIAL_SUP_CARD_IDS,
} from "@/consts";
import allGifts from "@/assets/allGifts";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

// カードが特殊効果を持つかどうかを判定する
const judgeDrawCard = (card: Card): boolean => {
  return !SPECIAL_CARD_IDS.includes(card.id as (typeof SPECIAL_CARD_IDS)[number]);
};

// ギフトパック処理を行う
async function processGiftPack(my: PlayerData, myId: string, playerAllocation: number): Promise<void> {
  const { player, id, myLog } = storeToRefs(playerStore);
  const { giftPackGauge, giftPackCounter } = toRefs(player.value);
  const { checkGiftPackAchieved } = playerStore;

  // cardの属性ごとに集計する
  const fieldNormalCard = my.field.filter((card) => !card.isSale);
  const fieldSaleCard = my.field.filter((card) => card.isSale);
  const uniqueCardCompanies = [...new Set(my.field.map((card) => card.company))];

  let fieldNormalCardGauge = 0;
  let fieldSaleCardGauge = 0;
  let uniqueCardCompaniesGauge = 0;
  // カードを使用
  if (fieldNormalCard.length > 0) {
    if (id.value === myId) {
      giftPackCounter.value.usedCard += fieldNormalCard.length;
      fieldNormalCardGauge += fieldNormalCard.length * GIFT_POINTS.NORMAL_CARD;
      myLog.value = LOG_MESSAGES.CARD_USED(fieldNormalCard.length, fieldNormalCard.length * GIFT_POINTS.NORMAL_CARD);
    }
  }
  // セールカードを使用
  if (fieldSaleCard.length > 0) {
    if (id.value === myId) {
      giftPackCounter.value.usedSaleCard += fieldSaleCard.length;
      fieldSaleCardGauge += fieldSaleCard.length * GIFT_POINTS.SALE_CARD;
      myLog.value = LOG_MESSAGES.SALE_CARD_USED(fieldSaleCard.length, fieldSaleCard.length * GIFT_POINTS.SALE_CARD);
    }
  }
  // 手札に同じ会社のカードが3枚以上ある場合、ギフトパックゲージを増加
  if (uniqueCardCompanies.length >= BATTLE_CONSTANTS.UNIQUE_COMPANIES_THRESHOLD) {
    if (id.value === myId) {
      giftPackCounter.value.haveNotSameCompanyCard++;
      uniqueCardCompaniesGauge += GIFT_POINTS.THREE_COMPANIES;
      myLog.value = LOG_MESSAGES.THREE_COMPANIES_USED(uniqueCardCompanies.length, GIFT_POINTS.THREE_COMPANIES);
    }
  }

  // ギフトパックゲージを更新
  giftPackGauge.value += fieldNormalCardGauge + fieldSaleCardGauge + uniqueCardCompaniesGauge;

  checkGiftPackAchieved();

  if (playerAllocation) {
    await updateDoc(doc(playersRef, myId), { giftPackGauge: my.giftPackGauge });
    await updateDoc(doc(playersRef, myId), { giftPackCounter: my.giftPackCounter });
  }
}

// 満腹度処理を行う
async function processHungry(
  my: PlayerData,
  enemy: PlayerData,
  which: "primary" | "second",
  myId: string,
  playerAllocation: number
): Promise<void> {
  my.status.hungry += my.sumFields.hungry;

  if (my.field.some((card) => card.id === 19) && which === "second") my.sumFields.hungry -= 25;
  if (my.isSaleZeroHungry) my.status.hungry -= my.field.reduce((acc, card) => (card.isSale ? acc + card.hungry : acc), 0);

  my.isSaleZeroHungry = false;
  if (playerAllocation) {
    await updateDoc(doc(playersRef, myId), { "status.hungry": my.status.hungry });
  }
}

// 支援処理を行う
async function processSupport(
  my: PlayerData,
  playerAllocation: number,
  myId: string,
  enemyId: string,
  myLog: { value: string },
  enemyLog: { value: string }
): Promise<void> {
  const { player } = storeToRefs(playerStore);
  if (my.field.map((card) => card.attribute).includes("sup")) {
    console.log(i, "支援!!!");

    await intervalForEach(
      (card: Card) => {
        // リストの中にcard.idが含まれているかを確認
        if (SPECIAL_SUP_CARD_IDS.includes(card.id as (typeof SPECIAL_SUP_CARD_IDS)[number])) {
          if (!(card.id === 23 || card.id === 24 || card.id === 25 || card.id === 26 || card.id === 27)) return;
          if (playerAllocation) enemyLog.value = card.name + "の効果!" + card.description;
          else myLog.value = card.name + "の効果!" + card.description;

          if (playerAllocation) return;
          if (card.id === 23) changeHandValue("waste", 1);
          if (card.id === 24) {
            player.value.isSaleZeroHungry = true;
            updateDoc(doc(playersRef, myId), { isSaleZeroHungry: true });
          }
          if (card.id === 25) {
            player.value.isShopSale = true;
            updateDoc(doc(playersRef, myId), { isShopSale: true });
          }
          if (card.id === 26) {
            deleteAllRottenCard();
            for (let i = 0; i < 3; i++) drawOneCard();
          }
        }
      },
      my.field,
      1000
    );

    await everyUtil(["sup", 0]);
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  }
}

// 回復処理を行う
async function processHeal(
  my: PlayerData,
  myId: string,
  playerAllocation: number,
  myLog: { value: string },
  enemyLog: { value: string }
): Promise<void> {
  if (my.field.map((card) => card.attribute).includes("heal")) {
    console.log(i, "回復!!!");

    my.status.hp += my.sumFields.heal;
    if (my.status.hp > my.status.maxHp) {
      my.status.hp = my.status.maxHp;
    }

    if (playerAllocation) {
      await updateDoc(doc(playersRef, myId), { "status.hp": my.status.hp });
    }

    await everyUtil(["heal", my.sumFields.heal]);
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  }
}

// 防御処理を行う
async function processDefense(
  my: PlayerData,
  enemy: PlayerData,
  myId: string,
  which: "primary" | "second",
  playerAllocation: number,
  myLog: { value: string },
  enemyLog: { value: string }
): Promise<number> {
  console.log(s, "防御!!!");
  let defense = 0;
  //敵の防御力を計算する
  if (enemy.field.map((card) => card.attribute).includes("def")) {
    if (which === "primary") {
      console.log(i, "先行なので防御できない");
    } else if (enemy.check) {
      console.log(i, "敵は行動不能なので防御できない");
    } else {
      await intervalForEach(
        (card: Card) => {
          // リストの中にcard.idが含まれているかを確認
          if (!SPECIAL_DEF_CARD_IDS.includes(card.id as (typeof SPECIAL_DEF_CARD_IDS)[number])) return;
          if (
            !(
              (card.id === 17 && my.field.length === 1) ||
              card.id === 19 ||
              (card.id === 15 && enemy.field.some((card) => card.company.includes("unlimit"))) ||
              card.id === 21
            )
          )
            return;

          if (card.id === 17 && enemy.field.length === 1) enemy.sumFields.def += 40;
        },
        enemy.field,
        1000
      );
      defense = enemy.sumFields.def;
    }
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  }

  //自分の防御を行う
  if (my.field.map((card) => card.attribute).includes("def") || my.giftActiveBeforeId === 6) {
    console.log(i, "防御!!!");

    await intervalForEach(
      (card: Card) => {
        // リストの中にcard.idが含まれているかを確認
        if (!SPECIAL_DEF_CARD_IDS.includes(card.id as (typeof SPECIAL_DEF_CARD_IDS)[number])) return;
        if (
          !(
            (card.id === 17 && my.field.length === 1) ||
            card.id === 19 ||
            (card.id === 15 && my.field.some((card) => card.company.includes("unlimit"))) ||
            card.id === 21
          )
        )
          return;
        if (playerAllocation) enemyLog.value = card.name + "の効果!" + card.description;
        else myLog.value = card.name + "の効果!" + card.description;

        // if (playerAllocation) return;
        if (card.id === 17 && my.field.length === 1) my.sumFields.def += 40;
      },
      my.field,
      1000
    );

    if (my.giftActiveBeforeId === 6) {
      my.sumFields.def += 40;
      updateDoc(doc(playersRef, myId), { "sumFields.def": my.sumFields.def });
    }

    await everyUtil(["def", my.sumFields.def]);
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  }

  return defense;
}

// 攻撃処理を行う
async function processAttack(
  my: PlayerData,
  enemy: PlayerData,
  which: "primary" | "second",
  defense: number,
  enemyId: string,
  playerAllocation: number,
  myLog: { value: string },
  enemyLog: { value: string }
): Promise<boolean> {
  if (my.field.map((card) => card.attribute).includes("atk") || my.giftActiveBeforeId === 5) {
    console.log(i, "マッスル攻撃!!!");

    if (my.giftActiveBeforeId === 5) my.sumFields.atk += 30;

    await intervalForEach(
      (card: Card) => {
        // リストの中にcard.idが含まれているかを確認
        if (!SPECIAL_ATK_CARD_IDS.includes(card.id as (typeof SPECIAL_ATK_CARD_IDS)[number])) return;
        if (
          !(
            (card.id === 6 && my.field.length === 1) ||
            card.id === 1 ||
            (card.id === 3 && which === "second") ||
            (card.id === 5 &&
              enemy.sumFields.hungry +
                enemy.status.hungry -
                (enemy.isSaleZeroHungry ? enemy.field.reduce((acc, card) => (card.isSale ? acc + card.hungry : acc), 0) : 0) >=
                50)
          )
        )
          return;

        if (playerAllocation) enemyLog.value = card.name + "の効果!" + card.description;
        else myLog.value = card.name + "の効果!" + card.description;

        if (card.id === 6 && my.field.length === 1) my.sumFields.atk += 20;
        if (card.id === 3 && which === "second") my.sumFields.atk -= 50;
        console.log(i, enemy.sumFields.hungry, my.sumFields.atk);
        if (
          card.id === 5 &&
          enemy.sumFields.hungry +
            enemy.status.hungry -
            (enemy.isSaleZeroHungry ? enemy.field.reduce((acc, card) => (card.isSale ? acc + card.hungry : acc), 0) : 0) >=
            50
        )
          my.sumFields.atk += 15;
        console.log(i, enemy.sumFields.hungry, my.sumFields.atk);

        if (playerAllocation) return;
        if (card.id === 1) changeHandValue("atk", 20, "atk");
      },
      my.field,
      1000
    );

    let holdingAtk = my.sumFields.atk - defense;
    if (holdingAtk < 0) holdingAtk = 0;

    console.log(i, "mySumFields.atk: ", my.sumFields.atk);

    if (playerAllocation) {
      enemy.status.hp -= holdingAtk;
      await updateDoc(doc(playersRef, enemyId), { "status.hp": enemy.status.hp });
    }

    if (defense > 0) {
      console.log(i, "相手のdefが", enemy.sumFields.def, "なので", holdingAtk, "のダメージ");
    } else {
      console.log(i, "マッスル攻撃でenemyに", holdingAtk, "のダメージ");
    }

    await everyUtil(["atk", my.sumFields.atk]);
    enemy.status.hp -= my.sumFields.atk;
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);

    //死亡判定
    const isMyDeath = await checkDeath(my);
    const isEnemyDeath = await checkDeath(enemy);
    console.log(i, "死亡判定: ", isEnemyDeath, isMyDeath);

    if (isEnemyDeath || isMyDeath) {
      return true;
    }
  }
  return false;
}

//ダメージを計算する
async function calcDamage(which: "primary" | "second"): Promise<boolean> {
  console.log(s, "calcDamageを実行しました");
  const { sign, battleResult, myLog, enemyLog } = storeToRefs(playerStore);
  const { game } = toRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);
  const { myId, enemyId, my, enemy } = await syncPlayer(which);

  // playerAllocation: 0=後攻, 1=先攻
  const playerAllocation =
    firstAtkPlayer.value === sign.value ? BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST : BATTLE_CONSTANTS.PLAYER_ALLOCATION.SECOND;

  //fieldが空の場合､ダメージ計算を行わない
  if (my.field.length === 0 && my.giftActiveBeforeId !== 5 && my.giftActiveBeforeId !== 6) {
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
    return false;
  }
  // 各処理を順番に実行
  await processGiftPack(my, myId, playerAllocation);
  await processHungry(my, enemy, which, myId, playerAllocation);

  if (!firstAtkPlayer.value) await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);

  await processSupport(my, playerAllocation, myId, enemyId, myLog, enemyLog);
  await processHeal(my, myId, playerAllocation, myLog, enemyLog);

  const defense = await processDefense(my, enemy, myId, which, playerAllocation, myLog, enemyLog);
  const isDeath = await processAttack(my, enemy, which, defense, enemyId, playerAllocation, myLog, enemyLog);

  battleResult.value = ["none", 0];
  return isDeath;
}

//攻撃を行う
async function attack(which: "primary" | "second"): Promise<boolean> {
  console.log(s, "attackを実行しました");
  const { components } = storeToRefs(playerStore);

  getEnemyPlayer(); //!
  components.value = which + "Atk";

  const isDeath = await calcDamage(which);
  await reflectStatus();
  console.log(i, "isDeath: ", isDeath);
  if (isDeath) return true;
  return false;
}

//戦闘処理を統括する
async function battle() {
  console.log(s, "battleを実行しました");
  const { id, player, components } = storeToRefs(playerStore);
  const { check } = toRefs(player.value);

  //checkの値がtrueになっていたら､行動済みとする
  check.value = false;
  updateDoc(doc(playersRef, id.value), { check: check.value });
  //先行後攻を決める
  await decideFirstAtkPlayer();

  console.log(i, "先行の攻撃");
  const isPrimaryDeath = await attack(BATTLE_CONSTANTS.PRIMARY);
  if (isPrimaryDeath) return;

  wait(BATTLE_CONSTANTS.WAIT_TIME.SHORT);

  console.log(i, "後攻の攻撃");
  const isSecondDeath = await attack(BATTLE_CONSTANTS.SECOND);
  if (isSecondDeath) return;

  getEnemyPlayer(); //!
  await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  components.value = "giftPack";

  //戦後処理
  await postBattle();
}

// カード腐り処理を行う
async function processCardRotting(
  id: string,
  hand: Card[],
  rottenHand: Card[],
  giftPackGauge: { value: number },
  giftPackCounter: { value: any },
  myLog: { value: string }
): Promise<number> {
  const { checkRotten } = playerStore;

  // handの腐り値を減らす
  changeHandValue("waste", -POST_BATTLE_CONSTANTS.WASTE_REDUCTION);
  await updateDoc(doc(playersRef, id), { hand: hand });

  // 腐っているカードにする
  const oldRotHandNum = rottenHand.length;
  checkRotten();
  const newRotHandNum = rottenHand.length;
  const rottenCardsCount = newRotHandNum - oldRotHandNum;

  if (rottenCardsCount > 0) {
    // ギフトパック処理
    giftPackGauge.value -= rottenCardsCount * GIFT_POINTS.ROTTEN_CARD_PENALTY;
    giftPackCounter.value.rottenCard += rottenCardsCount;
    myLog.value = LOG_MESSAGES.ROTTEN_CARD_PENALTY(rottenCardsCount, rottenCardsCount * GIFT_POINTS.ROTTEN_CARD_PENALTY);

    await updateDoc(doc(playersRef, id), { hand: hand });
    await updateDoc(doc(playersRef, id), { rottenHand: rottenHand });
  }

  return rottenCardsCount;
}

// 手札ボーナス処理を行う
async function postGiftPack(
  hand: Card[],
  rottenHand: Card[],
  giftPackGauge: { value: number },
  giftPackCounter: { value: any },
  rottenCardsCount: number,
  log: { value: string },
  myLog: { value: string },
  id: { value: string }
): Promise<void> {
  const { checkGiftPackAchieved } = playerStore;

  let hand0Card = 0;
  let have3UniqueCompanyCard = 0;
  let rottenCard = 0;

  // 手札が0枚になる
  if (hand.length === 0 && rottenHand.length === 0) {
    hand0Card += GIFT_POINTS.EMPTY_HAND;
    giftPackCounter.value.hand0Card += 1;
    myLog.value = LOG_MESSAGES.EMPTY_HAND_BONUS(GIFT_POINTS.EMPTY_HAND);
    console.log(i, "giftPackGauge: ", giftPackGauge.value);
  }
  // 同じ会社のカードが手札にない
  if (hand.length > 0) {
    const uniqueCompanyList = [...new Set(hand.map((card) => card.company))];
    if (uniqueCompanyList.length === hand.length) {
      have3UniqueCompanyCard += GIFT_POINTS.UNIQUE_COMPANIES;
      giftPackCounter.value.haveNotSameCompanyCard += 1;
      myLog.value = LOG_MESSAGES.UNIQUE_COMPANIES_BONUS(GIFT_POINTS.UNIQUE_COMPANIES);
      console.log(i, "giftPackGauge: ", giftPackGauge.value);
      console.log(i, hand, rottenHand);
    }
  }
  // このターンで腐ったカードの枚数を取得
  const nowRottenCardsCount = rottenHand.length - rottenCardsCount;
  if (nowRottenCardsCount > 0) {
    rottenCard -= nowRottenCardsCount * GIFT_POINTS.HAVE_ROTTEN_PENALTY;
    giftPackCounter.value.haveRottenCard += nowRottenCardsCount;
    log.value = LOG_MESSAGES.HAVE_ROTTEN_PENALTY(nowRottenCardsCount, nowRottenCardsCount * GIFT_POINTS.HAVE_ROTTEN_PENALTY);
    console.log(i, "giftPackGauge: ", giftPackGauge.value);
    console.log(i, rottenHand);
  }

  // ギフトパックゲージを更新
  let test = hand0Card + have3UniqueCompanyCard + rottenCard;
  giftPackGauge.value += test;

  checkGiftPackAchieved();

  await updateDoc(doc(playersRef, id.value), { giftPackGauge: giftPackGauge.value });
}

//戦闘後の処理
async function postBattle(): Promise<void> {
  console.log(s, "postBattleを実行しました");
  const { id, player, log, myLog, enemyLog, phase } = storeToRefs(playerStore);
  const { check, hand, rottenHand, field, idEnemy, giftPackGauge, giftPackCounter } = toRefs(player.value);
  const { enemyPlayer } = storeToRefs(enemyPlayerStore);
  const { field: enemyField, check: enemyCheck, giftActiveId: enemyGiftActiveId } = toRefs(enemyPlayer.value);

  // カード腐り処理
  const rottenCardsCount = await processCardRotting(id.value, hand.value, rottenHand.value, giftPackGauge, giftPackCounter, myLog);

  // 手札にあるカードの効果を発動する
  hand.value.forEach((card: Card) => {
    if (!(card.id === 14)) return;
    myLog.value += card.name + "の効果!" + card.description;
    if (card.id === 14) changeHandValue("def", 30, "def");
  });

  // ギフトパック処理
  postGiftPack(hand.value, rottenHand.value, giftPackGauge, giftPackCounter, rottenCardsCount, log, myLog, id);

  await wait(2000);
  enemyGiftActiveId.value = (await getDoc(doc(playersRef, idEnemy.value)))?.data()?.giftActiveId as number;
  phase.value = "giftPack";
}

// ターン終了処理を行う
export async function finalizeTurn(
  id: string,
  idGame: string,
  sign: number,
  check: { value: boolean },
  firstAtkPlayer: { value: any },
  giftPackGauge: { value: number },
  giftPackCounter: { value: any },
  giftActiveId: { value: number },
  giftActiveBeforeId: { value: number },
  isTrash: { value: boolean },
  sumFields: { value: SumCards }
): Promise<void> {
  const { checkGiftPackAchieved, deleteField } = playerStore;
  const { nextTurn } = gameStore;

  checkGiftPackAchieved();
  changeStatusValue("hungry", -POST_BATTLE_CONSTANTS.HUNGRY_REDUCTION);
  deleteField();
  nextTurn();

  check.value = false;
  firstAtkPlayer.value = undefined;
  isTrash.value = false;
  giftActiveBeforeId.value = giftActiveId.value;
  giftActiveId.value = -1;

  // ギフトパックの効果を発動
  giftActiveNextRound(giftActiveBeforeId);
  if (giftActiveBeforeId.value === 0) allGifts[giftActiveBeforeId.value].effect();
  if (giftActiveBeforeId.value === 1) allGifts[giftActiveBeforeId.value].effect();
  if (giftActiveBeforeId.value === 2) allGifts[giftActiveBeforeId.value].effect();
  if (giftActiveBeforeId.value === 3) allGifts[giftActiveBeforeId.value].effect();
  if (giftActiveBeforeId.value === 7) allGifts[giftActiveBeforeId.value].effect();

  await updateDoc(doc(playersRef, id), { giftPackGauge: giftPackGauge.value });
  await updateDoc(doc(playersRef, id), { giftPackCounter: giftPackCounter.value });
  await updateDoc(doc(playersRef, id), { giftActiveBeforeId: giftActiveBeforeId.value });
  await updateDoc(doc(playersRef, id), { giftActiveId: giftActiveId.value });
  await updateDoc(doc(playersRef, id), { check: check.value });

  if (sign) {
    await updateDoc(doc(gamesRef, idGame), { turn: increment(1) });
  }

  getEnemyPlayer();
}
export async function giftActiveNextRound(giftActiveBeforeId: { value: number }): Promise<void> {
  const { player, id } = storeToRefs(playerStore);
  const { sumFields, field } = toRefs(player.value);

  if (giftActiveBeforeId.value === 5) sumFields.value.atk += 30;
  if (giftActiveBeforeId.value === 6) sumFields.value.def += 40;
}

export { battle };
