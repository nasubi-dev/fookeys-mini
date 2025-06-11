import { toRefs } from "vue";
import { e, i, s } from "@/log";
import { enemyPlayerStore, gameStore, playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, doc, increment, updateDoc } from "firebase/firestore";
import type { GameData, PlayerData, Card } from "@/types";
import { converter } from "@/server/converter";
import { intervalForEach, wait, XOR } from "@/server/utils";
import { syncPlayer, reflectStatus, checkDeath, everyUtil, decideFirstAtkPlayer } from "./useBattleUtils";
import { getEnemyPlayer } from "@/server/usePlayerData";
import { changeHandValue, changeStatusValue, draw2ExchangedCard, drawRandomOneCard } from "@/server/useShopUtils";
import { startShop } from "./useShop";
import { GIFT_PACK_POINTS, SPECIAL_CARD_IDS } from "@/consts";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

// カードが特殊効果を持つかどうかを判定する
const judgeDrawCard = (card: Card): boolean => {
  return !SPECIAL_CARD_IDS.includes(card.id as (typeof SPECIAL_CARD_IDS)[number]);
};

// ギフトパック処理を行う
async function processGiftPack(my: PlayerData, myId: string, playerAllocation: number): Promise<void> {
  const { log } = storeToRefs(playerStore);
  const { checkGiftPackAchieved } = playerStore;

  // cardの属性ごとに集計する
  const fieldNormalCard = my.field.filter((card) => !card.isSale);
  const fieldSaleCard = my.field.filter((card) => card.isSale);
  const uniqueCardCompanies = [...new Set(my.field.map((card) => card.company))];

  // カードを使用
  if (fieldNormalCard.length !== 0) {
    my.giftPackGauge += fieldNormalCard.length * GIFT_PACK_POINTS.NORMAL_CARD;
    my.giftPackCounter.usedCard += fieldNormalCard.length;
    log.value = `カードを${fieldNormalCard.length}枚使用したので${fieldNormalCard.length * GIFT_PACK_POINTS.NORMAL_CARD}pt獲得した！`;
  }

  // セールカードを使用
  if (fieldSaleCard.length !== 0) {
    my.giftPackGauge += fieldSaleCard.length * GIFT_PACK_POINTS.SALE_CARD;
    my.giftPackCounter.usedSaleCard += fieldSaleCard.length;
    log.value = `セールカードを${fieldSaleCard.length}枚使用したので${fieldSaleCard.length * GIFT_PACK_POINTS.SALE_CARD}pt獲得した！`;
  }

  if (uniqueCardCompanies.length >= 3) {
    my.giftPackGauge += GIFT_PACK_POINTS.THREE_COMPANIES;
    my.giftPackCounter.used3CompanyCard += 1;
    log.value = "異なる会社のカードを3枚以上使用した！";
  }

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
    if (enemySumHungry > enemy.status.maxHungry) {
      enemySumHungry = enemy.status.maxHungry;
    }
  }
}

// 支援処理を行う
async function processSupport(my: PlayerData): Promise<void> {
  if (my.field.map((card) => card.attribute).includes("sup")) {
    await everyUtil(["sup", 0]);
    await wait(1000);
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
    await wait(1000);
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
    await wait(1000);
  }

  //自分の防御を行う
  if (my.field.map((card) => card.attribute).includes("def")) {
    console.log(i, "防御!!!");
    await everyUtil(["def", my.sumFields.def]);
    await wait(1000);
  }

  return defense;
}

// 攻撃処理を行う
async function processAttack(
  my: PlayerData,
  enemy: PlayerData,
  defense: number,
  myId: string,
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

    if (defense !== 0) {
      console.log(i, "相手のdefが", enemy.sumFields.def, "なので", holdingAtk, "のダメージ");
    } else {
      console.log(i, "マッスル攻撃でenemyに", holdingAtk, "のダメージ");
    }

    await everyUtil(["atk", my.sumFields.atk]);
    enemy.status.hp -= my.sumFields.atk;
    await wait(1000);

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
  const playerAllocation = firstAtkPlayer.value === sign.value ? 1 : 0;

  //fieldが空の場合､ダメージ計算を行わない
  if (my.field.length === 0) return false;

  // 各処理を順番に実行
  await processGiftPack(my, myId, playerAllocation);
  await processHungry(my, enemy, myId, playerAllocation);

  if (!firstAtkPlayer.value) await wait(1000);

  await processSupport(my);
  await processHeal(my, myId, playerAllocation);

  const defense = await processDefense(my, enemy, which);
  const isDeath = await processAttack(my, enemy, defense, myId, enemyId, playerAllocation);

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
  // await checkMission(which);
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
  const isPrimaryDeath = await attack("primary");
  if (isPrimaryDeath) return;

  wait(500);

  console.log(i, "後攻の攻撃");
  const isSecondDeath = await attack("second");
  if (isSecondDeath) return;

  getEnemyPlayer(); //!
  await wait(1000);
  components.value = "postBattle";

  //戦後処理
  await postBattle();
}
//戦闘後の処理
async function postBattle(): Promise<void> {
  console.log(s, "postBattleを実行しました");
  const { checkRotten, deleteField, checkGiftPackAchieved } = playerStore;
  const { id, player, sign, log, myLog, enemyLog } = storeToRefs(playerStore);
  const { check, idGame, hand, rottenHand, field, status, giftPackGauge, giftPackCounter } = toRefs(player.value);
  const { enemyPlayer } = storeToRefs(enemyPlayerStore);
  const { field: enemyField, check: enemyCheck } = toRefs(enemyPlayer.value);
  const { nextTurn } = gameStore;
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);

  //handの腐り値を減らす
  changeHandValue("waste", -1);
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
  //腐っているカードにする
  const oldRotHandNum = rottenHand.value.length;
  checkRotten();
  const newRotHandNum = rottenHand.value.length;
  let rottenCardsCount = newRotHandNum - oldRotHandNum;
  if (newRotHandNum !== oldRotHandNum) {
    if (newRotHandNum > oldRotHandNum) {
      //ギフトパック処理
      giftPackGauge.value -= rottenCardsCount * 50;
      giftPackCounter.value.rottenCard += rottenCardsCount;
      log.value = "カードを" + rottenCardsCount + "枚腐らせたので" + rottenCardsCount * 50 + "pt失った！";
    }
    updateDoc(doc(playersRef, id.value), { hand: hand.value });
    updateDoc(doc(playersRef, id.value), { rottenHand: rottenHand.value });
  }

  //このターン使用したカードの効果を発動する
  if (!enemyCheck.value) {
    enemyField.value.forEach((card: Card) => {
      if (judgeDrawCard(card)) return;
      enemyLog.value = card.name + "の効果!" + card.description;
    });
  }
  if (!check.value) {
    field.value.forEach((card: Card) => {
      if (judgeDrawCard(card)) return;
      myLog.value = card.name + "の効果!" + card.description;
      // if (card.id === 50) drawRandomOneCard("atk");
      // if (card.id === 51) drawRandomOneCard("tech");
      // if (card.id === 52) drawRandomOneCard("def");
      // if (card.id === 53) drawRandomOneCard("sup");
      // if (card.id === 60) draw2ExchangedCard();
      // if (card.id === 7 || card.id === 24 || card.id === 41) status.value.hungry >= 100 ? (status.value.hungry -= 25) : null;
    });
  }

  //手札が0枚になる
  if (hand.value.length === 0 && rottenHand.value.length === 0) {
    //ギフトパック処理
    giftPackGauge.value += 30;
    giftPackCounter.value.hand0Card += 1;
    log.value = "手札が0枚になったので、ギフトパックを30pt獲得した！";
    console.log(i, "giftPackGauge: ", giftPackGauge.value);
  }

  //同じ会社のカードが手札にない
  if (hand.value.length !== 0) {
    const uniqueCompanyList = [...new Set(hand.value.map((card) => card.company))];
    if (uniqueCompanyList.length === hand.value.length) {
      //ギフトパック処理
      giftPackGauge.value += 10;
      giftPackCounter.value.haveNotSameCompanyCard += 1;
      log.value = "手札に同じ会社のカードがないので、ギフトパックを10pt獲得した！";
      console.log(i, "giftPackGauge: ", giftPackGauge.value);
      console.log(i, hand.value, rottenHand.value);
    }
  }

  //手札にあるカードの効果を発動する
  hand.value.forEach((card: Card) => {
    // if (card.id === 6) changeHandValue("hungry", -5);
    // myLog.value = card.name + "の効果!" + card.description;
  });

  // 腐ったカードの枚数だけgiftPackGaugeを増加
  // このターンで腐ったカードの枚数を取得
  let nowRottenCardsCount = rottenHand.value.length - rottenCardsCount;
  if (nowRottenCardsCount !== 0) {
    // ギフトパック処理
    giftPackGauge.value -= nowRottenCardsCount * 10;
    giftPackCounter.value.haveRottenCard += nowRottenCardsCount;
    log.value = nowRottenCardsCount + "枚の腐ったカードを持っているので、ギフトパックを" + nowRottenCardsCount * 10 + "ptを失った！";
    console.log(i, "giftPackGauge: ", giftPackGauge.value);
    console.log(i, hand.value, rottenHand.value);
  }

  checkGiftPackAchieved();
  changeStatusValue("hungry", -40);
  deleteField();
  nextTurn();
  check.value = false;
  firstAtkPlayer.value = undefined;
  updateDoc(doc(playersRef, id.value), { giftPackGauge: giftPackGauge.value });
  updateDoc(doc(playersRef, id.value), { giftPackCounter: giftPackCounter.value });
  updateDoc(doc(playersRef, id.value), { check: check.value });
  if (sign.value) updateDoc(doc(gamesRef, idGame.value), { turn: increment(1) });

  getEnemyPlayer(); //!
  //shopを開く
  startShop();
}
export { battle };
