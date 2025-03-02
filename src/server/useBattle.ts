import { toRefs } from "vue";
import { e, i, s } from "@/log";
import { enemyPlayerStore, gameStore, playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, doc, increment, updateDoc } from "firebase/firestore";
import type { GameData, PlayerData, Card } from "@/types";
import { converter } from "@/server/converter";
import { intervalForEach, wait, XOR } from "@/server/utils";
import { syncPlayer, reflectStatus, checkDeath, everyUtil, checkMission, decideFirstAtkPlayer } from "./useBattleUtils";
import { getEnemyPlayer } from "@/server/usePlayerData";
import { changeHandValue, changeStatusValue, draw2ExchangedCard, drawRandomOneCard } from "@/server/useShopUtils";
import { startShop } from "./useShop";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

//ダメージを計算する
async function calcDamage(which: "primary" | "second"): Promise<boolean> {
  console.log(s, "calcDamageを実行しました");
  const { sign, battleResult, log, myLog, enemyLog } = storeToRefs(playerStore);
  const { game } = toRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);
  const { myId, enemyId, my, enemy } = await syncPlayer(which);
  // playerAllocation: 0=後攻, 1=先攻
  const playerAllocation = firstAtkPlayer.value === sign.value ? 1 : 0;
  // attackOrder: true=先攻, false=後攻
  const attackOrder = XOR(playerAllocation === 0, which === "primary");

  //fieldが空の場合､ダメージ計算を行わない
  if (my.field.length === 0) return false;
  //寄付をしていた場合､ダメージ計算を行わない
  if (my.donate) {
    my.status.contribution += my.field.length * 5;
    if (playerAllocation) updateDoc(doc(playersRef, myId), { "status.contribution": my.status.contribution });
    if (my.isSelectedGift === 8) battleResult.value = ["def", 999];
    await everyUtil(["donate", my.field.length * 5]);
    battleResult.value = ["none", 0];
    return false;
  }

  //自分がこのターン､行動不能の場合､ダメージ計算を行わない
  my.status.hungry += my.sumFields.hungry;
  if (playerAllocation) updateDoc(doc(playersRef, myId), { "status.hungry": my.status.hungry });

  //相手がこのターン､行動不能の場合､ダメージ計算を行わない
  let enemySumHungry = enemy.status.hungry;
  if (enemySumHungry > enemy.status.maxHungry) {
    enemy.check = false;
    //hungryの値が上限を超えていた場合､上限値にする
    if (enemySumHungry > enemy.status.maxHungry) enemySumHungry = enemy.status.maxHungry;
  }

  //支援を行う
  if (my.field.map((card) => card.attribute).includes("sup")) {
    await everyUtil(["sup", 0]);
    intervalForEach(
      (card: Card) => {
        if (!(card.id === 56 || card.id === 57 || card.id === 58 || card.id === 62)) return;
        if (!attackOrder) {
          enemyLog.value = card.name + "の効果!" + card.description;
          return;
        }
        myLog.value = card.name + "の効果!" + card.description;
        if (card.id === 56) changeHandValue("atk", 10, "atk");
        if (card.id === 57) changeHandValue("def", 20, "def");
        if (card.id === 58) {
          changeHandValue("hungry", -20, "def");
          changeHandValue("waste", 2, "def");
          changeHandValue("def", 50, "def");
        }
        if (card.id === 62) changeStatusValue("maxHungry", 20, true);
      },
      my.field,
      100
    );
  }

  //回復を行う
  if (my.field.map((card) => card.attribute).includes("heal")) {
    my.status.hp += my.sumFields.heal;
    if (my.status.hp > my.status.maxHp) my.status.hp = my.status.maxHp;

    if (playerAllocation) updateDoc(doc(playersRef, myId), { "status.hp": my.status.hp });
    await everyUtil(["heal", my.sumFields.heal]);
  }

  //敵の防御力を計算する
  let defense = 0;
  if (enemy.field.map((card) => card.attribute).includes("def") || enemy.isSelectedGift === 8) {
    if (which === "primary") console.log(i, "先行なので防御できない");
    else if (enemy.check) console.log(i, "敵は行動不能なので防御できない");
    else defense = enemy.sumFields.def;
  }

  //自分の防御を行う//?エフェクトのみ
  if (my.field.map((card) => card.attribute).includes("def") || my.isSelectedGift === 8) {
    console.log(i, "防御!!!");
    //特殊効果を発動する
    intervalForEach(
      async (card: Card) => {
        if (!(((card.id === 43 || card.id === 46) && which === "second") || card.id === 54)) return;
        if (!attackOrder) {
          enemyLog.value = card.name + "の効果!" + card.description;
          return;
        }
        myLog.value = card.name + "の効果!" + card.description;
        if (card.id === 43 && which === "second") {
          my.status.hungry -= 50;
          await updateDoc(doc(playersRef, myId), { "status.hungry": my.status.hungry });
        }
        if (card.id === 46 && which === "second") {
          my.status.hungry -= 60;
          await updateDoc(doc(playersRef, myId), { "status.hungry": my.status.hungry });
        }
        if (card.id === 54) {
          my.sumFields.def += my.status.hungry;
          await updateDoc(doc(playersRef, myId), { "sumFields.def": my.sumFields.def });
        }
      },
      my.field,
      100
    );
    // await reflectStatus();

    await everyUtil(["def", my.sumFields.def]);
  }

  //マッスル攻撃を行う
  if (my.field.map((card) => card.attribute).includes("atk")) {
    console.log(i, "マッスル攻撃!!!");
    //特殊効果を発動する
    intervalForEach(
      (card: Card) => {
        if (!(card.id === 10 || (card.id === 48 && which === "second") || card.id === 64)) return;
        if (!attackOrder) enemyLog.value = card.name + "の効果!" + card.description;
        else myLog.value = card.name + "の効果!" + card.description;
        if (card.id === 10) defense = 0;
        if (card.id === 48 && which === "second") my.sumFields.atk += 75;
      },
      my.field,
      100
    );
    // await reflectStatus();

    let holdingAtk = my.sumFields.atk - defense;
    if (holdingAtk < 0) holdingAtk = 0;
    console.log(i, "mySumFields.atk: ", my.sumFields.atk);
    if (playerAllocation) enemy.status.hp -= holdingAtk;
    if (enemy.status.hp < 0) enemy.status.hp = 0;
    if (defense !== 0) console.log(i, "相手のdefが", enemy.sumFields.def, "なので", holdingAtk, "のダメージ");
    else console.log(i, "マッスル攻撃でenemyに", holdingAtk, "のダメージ");

    if (playerAllocation) updateDoc(doc(playersRef, enemyId), { "status.hp": enemy.status.hp });
    await everyUtil(["atk", my.sumFields.atk]);

    //死亡判定
    const isEnemyDeath = await checkDeath(enemy);
    const isMyDeath = await checkDeath(my);
    console.log(i, "死亡判定: ", isEnemyDeath, isMyDeath);
    if (isEnemyDeath || isMyDeath) {
      battleResult.value = ["none", 0];
      return true;
    }
  }

  //テクニック攻撃を行う
  if (my.field.map((card) => card.attribute).includes("tech")) {
    console.log(i, "テクニック攻撃!!!");
    battleResult.value = ["none", 0]; //DamageAnimationのための処理
    //特殊効果を発動する
    intervalForEach(
      (card: Card) => {
        if (!(card.id === 17 || card.id === 20 || card.id === 25 || ((card.id === 28 || card.id === 30) && enemy.status.hungry >= 100)))
          return;
        if (!attackOrder) {
          enemyLog.value = card.name + "の効果!" + card.description;
          if ((card.id === 28 || card.id === 30) && enemy.status.hungry >= 100) {
            my.sumFields.tech += 30;
          }
          return;
        }
        myLog.value = card.name + "の効果!" + card.description;
        if (card.id === 17 || card.id === 20) changeStatusValue("contribution", 5);
        if (card.id === 25) changeStatusValue("contribution", 50);
        if ((card.id === 28 || card.id === 30) && enemy.status.hungry >= 100) {
          my.sumFields.tech += 30;
        }
      },
      my.field,
      100
    );
    // await reflectStatus();

    let holdingTech = my.sumFields.tech;
    if (playerAllocation) enemy.status.hp -= holdingTech;
    console.log(i, "mySumFields.tech: ", my.sumFields.tech);
    if (enemy.status.hp < 0) enemy.status.hp = 0;
    console.log(i, "テクニック攻撃でenemyに", holdingTech, "のダメージ");

    if (playerAllocation) updateDoc(doc(playersRef, enemyId), { "status.hp": enemy.status.hp });
    await everyUtil(["tech", holdingTech]);

    //死亡判定
    const isEnemyDeath = await checkDeath(enemy);
    const isMyDeath = await checkDeath(my);
    console.log(i, "死亡判定: ", isEnemyDeath, isMyDeath);
    if (isEnemyDeath || isMyDeath) {
      battleResult.value = ["none", 0];
      return true;
    }
  }

  battleResult.value = ["none", 0];
  return false;
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
  await checkMission(which);
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
  const { checkRotten, deleteField } = playerStore;
  const { id, player, sign, log, myLog, enemyLog } = storeToRefs(playerStore);
  const { check, idGame, isSelectedGift, hand, rottenHand, field, status, donate } = toRefs(player.value);
  const { enemyPlayer } = storeToRefs(enemyPlayerStore);
  const { field: enemyField, donate: enemyDonate, check: enemyCheck } = toRefs(enemyPlayer.value);
  const { nextTurn } = gameStore;
  const { game } = storeToRefs(gameStore);
  const { firstAtkPlayer } = toRefs(game.value);
  const judgeDrawCard = (card: Card): boolean => {
    if (
      !(
        card.id === 7 ||
        card.id === 24 ||
        card.id === 41 ||
        card.id === 50 ||
        card.id === 51 ||
        card.id === 52 ||
        card.id === 53 ||
        card.id === 60
      )
    ) {
      return true;
    }
    return false;
  };

  //handの腐り値を減らす
  changeHandValue("waste", -1);
  updateDoc(doc(playersRef, id.value), { hand: hand.value });
  //腐っているカードにする
  const oldHandNum = rottenHand.value.length;
  checkRotten();
  const newHandNum = rottenHand.value.length;
  if (newHandNum !== oldHandNum) {
    if (newHandNum > oldHandNum) log.value = newHandNum - oldHandNum + "枚のカードが腐ってしまった！";
    changeStatusValue("maxHungry", -20 * (newHandNum - oldHandNum), false);
    updateDoc(doc(playersRef, id.value), { hand: hand.value });
    updateDoc(doc(playersRef, id.value), { rottenHand: rottenHand.value });
    updateDoc(doc(playersRef, id.value), { status: status.value });
  }

  //このターン使用したカードの効果を発動する
  if (!enemyCheck.value && !enemyDonate.value) {
    enemyField.value.forEach((card: Card) => {
      if (judgeDrawCard(card)) return;
      enemyLog.value = card.name + "の効果!" + card.description;
    });
  }
  if (!check.value && !donate.value) {
    field.value.forEach((card: Card) => {
      if (judgeDrawCard(card)) return;
      myLog.value = card.name + "の効果!" + card.description;
      if (card.id === 50) drawRandomOneCard("atk");
      if (card.id === 51) drawRandomOneCard("tech");
      if (card.id === 52) drawRandomOneCard("def");
      if (card.id === 53) drawRandomOneCard("sup");
      if (card.id === 60) draw2ExchangedCard();
      if (card.id === 7 || card.id === 24 || card.id === 41) status.value.hungry >= 100 ? (status.value.hungry -= 25) : null;
    });
  }
  //手札にあるカードの効果を発動する
  hand.value.forEach((card: Card) => {
    if (!(card.id === 6)) return;
    myLog.value = card.name + "の効果!" + card.description;
    changeHandValue("hungry", -5);
  });

  //満腹値を減らす
  changeStatusValue("hungry", -40);
  deleteField();
  nextTurn();
  check.value = false;
  isSelectedGift.value = undefined;
  firstAtkPlayer.value = undefined;
  updateDoc(doc(playersRef, id.value), { check: check.value });
  if (sign.value) updateDoc(doc(gamesRef, idGame.value), { turn: increment(1) });

  getEnemyPlayer(); //!
  //shopを開く
  startShop();
}
export { battle };
