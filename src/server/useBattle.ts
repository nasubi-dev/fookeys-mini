import { toRefs } from "vue";
import { e, i, s } from "@/log";
import { enemyPlayerStore, gameStore, playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, doc, increment, updateDoc } from "firebase/firestore";
import type { GameData, PlayerData, Card } from "@/types";
import { converter } from "@/server/converter";
import { intervalForEach, wait, XOR } from "@/server/utils";
import { syncPlayer, reflectStatus, checkDeath, everyUtil, decideFirstAtkPlayer, giftCheck } from "./useBattleUtils";
import { getEnemyPlayer } from "@/server/usePlayerData";
import { changeHandValue, changeStatusValue } from "@/server/useShopUtils";
import { startShop } from "./useShop";
import { GIFT_POINTS, SPECIAL_CARD_IDS, POST_BATTLE_CONSTANTS, BATTLE_CONSTANTS, LOG_MESSAGES } from "@/consts";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

// カードが特殊効果を持つかどうかを判定する
const judgeDrawCard = (card: Card): boolean => {
  return !SPECIAL_CARD_IDS.includes(card.id as (typeof SPECIAL_CARD_IDS)[number]);
};

// ギフトパック処理を行う
async function processGiftPack(my: PlayerData, myId: string, playerAllocation: number): Promise<void> {
  const { log, player, id, myLog } = storeToRefs(playerStore);
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
async function processHungry(my: PlayerData, enemy: PlayerData, myId: string, playerAllocation: number): Promise<void> {
  //自分がこのターン､行動不能の場合､ダメージ計算を行わない
  my.status.hungry += my.sumFields.hungry;
  if (playerAllocation) {
    await updateDoc(doc(playersRef, myId), { "status.hungry": my.status.hungry });
  }

  //相手がこのターン､行動不能の場合､ダメージ計算を行わない
  let enemySumHungry = enemy.status.hungry;
  if (enemySumHungry > enemy.status.maxHungry) {
    enemy.check = false;
    //hungryの値が上限を超えていた場合､上限値にする
    enemySumHungry = enemy.status.maxHungry;
  }
}

// 支援処理を行う
async function processSupport(my: PlayerData): Promise<void> {
  if (my.field.map((card) => card.attribute).includes("sup")) {
    await everyUtil(["sup", 0]);
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  }
}

// 回復処理を行う
async function processHeal(my: PlayerData, myId: string, playerAllocation: number): Promise<void> {
  if (my.field.map((card) => card.attribute).includes("heal")) {
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
async function processDefense(my: PlayerData, enemy: PlayerData, which: "primary" | "second"): Promise<number> {
  let defense = 0;

  //敵の防御力を計算する
  if (enemy.field.map((card) => card.attribute).includes("def")) {
    if (which === "primary") {
      console.log(i, "先行なので防御できない");
    } else if (enemy.check) {
      console.log(i, "敵は行動不能なので防御できない");
    } else {
      defense = enemy.sumFields.def;
    }
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  }

  //自分の防御を行う
  if (my.field.map((card) => card.attribute).includes("def")) {
    console.log(i, "防御!!!");
    await everyUtil(["def", my.sumFields.def]);
    await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);
  }

  return defense;
}

// 攻撃処理を行う
async function processAttack(
  my: PlayerData,
  enemy: PlayerData,
  defense: number,
  enemyId: string,
  playerAllocation: number
): Promise<boolean> {
  if (my.field.map((card) => card.attribute).includes("atk")) {
    console.log(i, "マッスル攻撃!!!");

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
  const { sign, battleResult } = storeToRefs(playerStore);
  const { game } = toRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);
  const { myId, enemyId, my, enemy } = await syncPlayer(which);

  // playerAllocation: 0=後攻, 1=先攻
  const playerAllocation =
    firstAtkPlayer.value === sign.value ? BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST : BATTLE_CONSTANTS.PLAYER_ALLOCATION.SECOND;

  //fieldが空の場合､ダメージ計算を行わない
  if (my.field.length === 0) return false;

  // 各処理を順番に実行
  await processGiftPack(my, myId, playerAllocation);
  await processHungry(my, enemy, myId, playerAllocation);

  if (!firstAtkPlayer.value) await wait(BATTLE_CONSTANTS.WAIT_TIME.STANDARD);

  await processSupport(my);
  await processHeal(my, myId, playerAllocation);

  const defense = await processDefense(my, enemy, which);
  const isDeath = await processAttack(my, enemy, defense, enemyId, playerAllocation);

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
  giftPackCounter: { value: any }
): Promise<number> {
  const { log, myLog } = storeToRefs(playerStore);
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

// カード効果発動処理を行う
function processCardEffects(
  enemyCheck: boolean,
  enemyField: Card[],
  enemyLog: { value: string },
  check: boolean,
  field: Card[],
  myLog: { value: string }
): void {
  // このターン使用したカードの効果を発動する
  if (!enemyCheck) {
    enemyField.forEach((card: Card) => {
      if (judgeDrawCard(card)) return;
      enemyLog.value = card.name + "の効果!" + card.description;
    });
  }

  if (!check) {
    field.forEach((card: Card) => {
      if (judgeDrawCard(card)) return;
      myLog.value = card.name + "の効果!" + card.description;
      // コメントアウトされた特殊効果処理
      // if (card.id === 50) drawRandomOneCard("atk");
      // if (card.id === 51) drawRandomOneCard("tech");
      // if (card.id === 52) drawRandomOneCard("def");
      // if (card.id === 53) drawRandomOneCard("sup");
      // if (card.id === 60) draw2ExchangedCard();
      // if (card.id === 7 || card.id === 24 || card.id === 41) status.value.hungry >= 100 ? (status.value.hungry -= 25) : null;
    });
  }
}

// 手札ボーナス処理を行う
async function postGiftPack(
  hand: Card[],
  rottenHand: Card[],
  giftPackGauge: { value: number },
  giftPackCounter: { value: any },
  rottenCardsCount: number
): Promise<void> {
  const { log, myLog, id } = storeToRefs(playerStore);
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
  giftPackGauge.value += hand0Card + have3UniqueCompanyCard + rottenCard;

  checkGiftPackAchieved();

  await updateDoc(doc(playersRef, id.value), { giftPackGauge: giftPackGauge.value });
}

// ターン終了処理を行う
async function finalizeTurn(
  id: string,
  idGame: string,
  sign: number,
  check: { value: boolean },
  firstAtkPlayer: { value: any },
  giftPackGauge: { value: number },
  giftPackCounter: { value: any }
): Promise<void> {
  const { player } = storeToRefs(playerStore);
  const { isTrash } = toRefs(player.value);
  const { checkGiftPackAchieved, deleteField } = playerStore;
  const { nextTurn } = gameStore;

  checkGiftPackAchieved();
  changeStatusValue("hungry", -POST_BATTLE_CONSTANTS.HUNGRY_REDUCTION);
  deleteField();
  nextTurn();

  check.value = false;
  firstAtkPlayer.value = undefined;
  isTrash.value = false;

  await updateDoc(doc(playersRef, id), { giftPackGauge: giftPackGauge.value });
  await updateDoc(doc(playersRef, id), { giftPackCounter: giftPackCounter.value });
  await updateDoc(doc(playersRef, id), { check: check.value });

  if (sign) {
    await updateDoc(doc(gamesRef, idGame), { turn: increment(1) });
  }

  getEnemyPlayer();
  // startShop();
}

//戦闘後の処理
async function postBattle(): Promise<void> {
  console.log(s, "postBattleを実行しました");
  const { id, player, sign, log, myLog, enemyLog, phase } = storeToRefs(playerStore);
  const { check, idGame, hand, rottenHand, field, status, giftPackGauge, giftPackCounter, giftActiveId } = toRefs(player.value);
  const { enemyPlayer } = storeToRefs(enemyPlayerStore);
  const { field: enemyField, check: enemyCheck, giftActiveId: enemyGiftActiveId } = toRefs(enemyPlayer.value);
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);
  const { components } = storeToRefs(playerStore);

  // カード腐り処理
  const rottenCardsCount = await processCardRotting(id.value, hand.value, rottenHand.value, giftPackGauge, giftPackCounter);

  // カード効果発動処理
  processCardEffects(enemyCheck.value, enemyField.value, enemyLog, check.value, field.value, myLog);

  // 手札にあるカードの効果を発動する
  hand.value.forEach((card: Card) => {});

  // ギフトパック処理
  postGiftPack(hand.value, rottenHand.value, giftPackGauge, giftPackCounter, rottenCardsCount);

  await wait(1000);
  // ギフトパック処理
  phase.value = "giftPack";

  // ターン終了処理
  if (giftActiveId.value !== -1) await wait(2000);
  if (enemyGiftActiveId.value !== -1) await wait(2000);

  components.value = "postBattle";
  await finalizeTurn(id.value, idGame.value, sign.value, check, firstAtkPlayer, giftPackGauge, giftPackCounter);
  await startShop();
}
export { battle };
