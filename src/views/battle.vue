<script setup lang="ts">
import { onMounted, toRefs, watch, ref, onUnmounted, defineAsyncComponent } from "vue";
import { usePush, Notivue, Notifications, filledIcons } from "notivue";
import { useSound } from "@vueuse/sound";
import { playerStore, enemyPlayerStore, gameStore } from "@/main";
import { storeToRefs } from "pinia";
import { e, s, i } from "@/log";
import { intervalForEach, wait, XOR } from "@/server/utils";
import { getEnemyPlayer, initPlayer } from "@/server/usePlayerData";
import { deleteGame, watchDeleteGame } from "@/server/useMatchMaking";
import { drawRandomOneCard } from "@/server/useShopUtils";
import { startShop } from "@/server/useShop";
import Expanded from "@/components/Expanded.vue";
import UiEnemyInfo from "@/components/uiEnemyInfo.vue";
import UiStatus from "@/components/uiStatus.vue";
import UiHand from "@/components/uiHand.vue";
import Battle from "@/components/battle.vue";
import backImg from "@/assets/img/ui/back.png";
import winImg from "@/assets/img/ui/win.png";
import loseImg from "@/assets/img/ui/lose.png";
import myTurnImg from "@/assets/gifs/myTurn.png";
import enemyTurnImg from "@/assets/gifs/enemyTurn.png";
import configImg from "@/assets/img/ui/config.png";
import soundOnImg from "@/assets/img/ui/soundOn.png";
import soundOffImg from "@/assets/img/ui/soundOff.png";
import turnBackgroundImg from "@/assets/img/ui/turnBackground.png";
import waitingGif from "@/assets/gifs/waiting.gif";
import startGif from "@/assets/gifs/start.gif";
import winGif from "@/assets/gifs/win.gif";
import loseGif from "@/assets/gifs/lose.gif";
import allGifts from "@/assets/allGifts";
import { tap2, enemyTurn, myTurn, battleStart, atk, def, tech, hp, sup, rotten } from "@/assets/sounds";
import bgm from "@/assets/sounds/bgm.mp3";
import win from "@/assets/sounds/win.mp3";
import lose from "@/assets/sounds/lose.mp3";

const Shop = defineAsyncComponent(() => import("@/components/shop.vue"));
const UiUseCard = defineAsyncComponent(() => import("@/components/uiUseCard.vue"));
const UiUseCardDisplay = defineAsyncComponent(() => import("@/components/uiUseCardDisplay.vue"));
const myLogImg = defineAsyncComponent(() => import("@/components/myLog.vue"));
const enemyLogImg = defineAsyncComponent(() => import("@/components/enemyLog.vue"));

const useBGM = useSound(bgm, { volume: 0.3, loop: true });
const useWin = useSound(win, { volume: 0.5 });
const useLose = useSound(lose, { volume: 0.5 });
const useTap2 = useSound(tap2);
const useEnemyTurn = useSound(enemyTurn);
const useMyTurn = useSound(myTurn);
const useBattleStart = useSound(battleStart);
const useRotten = useSound(rotten, { volume: 0.5 });
const useHp = useSound(hp, { volume: 0.5 });
const useSup = useSound(sup, { volume: 0.5 });
const useDef = useSound(def);
const useAtk = useSound(atk);
const useTech = useSound(tech);

const { id, player, cardLock, phase, offer, sign, log, myLog, enemyLog, sumCards, isMobile, components, battleResult } =
  storeToRefs(playerStore);
const { idGame, idEnemy, match, character, gifts, status, hand, rottenHand, death, field, sumFields, name, check } = toRefs(player.value);
const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { game } = storeToRefs(gameStore);
const { players, turn, firstAtkPlayer } = toRefs(game.value);

//log
const customIcons = {
  success: myLogImg,
  error: enemyLogImg,
  info: filledIcons.info,
  close: filledIcons.close,
  promise: filledIcons.promise,
};
const push = usePush();
watch(log, () => {
  if (log.value === "") return;
  push.info({
    message: log.value,
    duration: 8000,
  });
  if (log.value.includes("枚のカードが腐ってしまった！")) useRotten.play();
  log.value = "";
});
watch(myLog, () => {
  if (myLog.value === "") return;
  push.success({
    message: myLog.value,
    duration: 8000,
  });
  myLog.value = "";
});
watch(enemyLog, () => {
  if (enemyLog.value === "") return;
  push.error({
    message: enemyLog.value,
    duration: 8000,
  });
  enemyLog.value = "";
});

//BGMの再生
const isBGM = ref(false);
watch(isBGM, (newVal) => {
  if (newVal) useBGM.play();
  else useBGM.pause();
});

//勝利時､敗北時に再生
watch(death, (newVal) => {
  if (!newVal || !isBGM.value) return;
  useBGM.stop();

  const isLose = status.value.hp <= 0 || hand.value.filter((card) => card.id === 0).length >= 9;
  isLose ? useLose.play() : useWin.play();
});

//カード使用時に再生
watch(battleResult, (newVal) => {
  if (newVal[0] === "heal") useHp.play();
  if (newVal[0] === "sup") useSup.play();
  if (newVal[0] === "def") useDef.play();
  if (newVal[0] === "atk") useAtk.play();
  if (newVal[0] === "tech") useTech.play();
});
//Phaseが変わったら再生
watch(phase, (newVal) => {
  if (newVal === "shop") {
    setTimeout(async () => {
      await getEnemyPlayer();
    }, 2000);
  }
});

//入場したらPlayer型としてIDが保管される
const loadGame = ref(true);
onMounted(async () => {
  sign.value = id.value === players.value[0] ? 0 : 1;
  setTimeout(async () => {
    useBattleStart.play();
    await getEnemyPlayer();
    await watchDeleteGame();
    console.log(s, "マッチ成功!相手ID:", idEnemy.value, "ゲームID:", idGame.value);
    log.value = "マッチ成功!相手:" + enemyPlayer.value.name;
    loadGame.value = false;
    isBGM.value = true;
  }, 1700);
  await startShop().then(() => {
    console.log(i, "gameId: ", idGame.value);
    console.log(i, "player1: ", players.value[0], "player2: ", players.value[1]);
    console.log(i, "your id: ", id.value, "your sign: ", sign.value);
    console.log(i, "character: ", character.value);
    console.log(
      i,
      "gift: ",
      gifts.value.map((gift) => allGifts[gift].name)
    );
    console.log(i, "status: ", "hp: ", status.value.hp, "hungry: ", status.value.hungry);
    console.log(
      i,
      "hand: ",
      hand.value.map((card) => card.name)
    );
    console.log(i, "turn: ", turn.value);
  });
});
//離脱したらGame､PlayerDataが削除される
onUnmounted(() => {
  window.alert("戦闘画面を離れます"); //alert
  useBGM.stop();
  useWin.stop();
  useLose.stop();
  deleteGame();
  initPlayer();
});

const myTurnAnimation = ref(false);
const enemyTurnAnimation = ref(false);
watch(components, (newVal) => {
  if (newVal === "postBattle" || newVal === "afterDecideFirstAtkPlayer") return;
  if (!XOR(newVal === "primaryAtk", sign.value === firstAtkPlayer.value)) {
    myTurnAnimation.value = true;
    useMyTurn.play();
  } else {
    enemyTurnAnimation.value = true;
    useEnemyTurn.play();
  }
});
const loadMyTurnImg = () => {
  setTimeout(() => {
    myTurnAnimation.value = false;
  }, 1000);
};
const loadEnemyTurnImg = () => {
  setTimeout(() => {
    enemyTurnAnimation.value = false;
  }, 1000);
};
const deathAnimation = ref(false);
watch(death, (newVal) => {
  if (newVal) {
    deathAnimation.value = true;
  }
});
const loadDeathGif = () => {
  setTimeout(() => {
    deathAnimation.value = false;
  }, 1200);
};
const startAnimation = ref(true);
const loadStartGif = () => {
  setTimeout(() => {
    startAnimation.value = false;
  }, 1700);
};
const wantCard = ref(); //!test用
const devMode = ref(false);
</script>

<template>
  <Expanded>
    <Notivue v-slot="item">
      <Notifications :item="item" :icons="customIcons" />
    </Notivue>
    <div class="w-full">
      <img v-if="startAnimation" @load="loadStartGif()" :src="startGif" class="fixed top-0 left-0 right-0 z-10 aspect-square" />
      <!-- 死亡時 -->
      <div v-if="death" class="flex flex-col fixed top-0 left-0 right-0 z-10">
        <div
          v-if="
            status.hp <= 0 ||
            hand.reduce((acc, cur) => {
              if (cur.id === 0) acc++;
              return acc;
            }, 0) >= 9
          "
          class="flex flex-col items-center justify-center"
        >
          <button
            @click="
              deleteGame();
              initPlayer();
              useTap2.play();
            "
          >
            <img @load="loadDeathGif()" :src="deathAnimation ? loseGif : loseImg" />
            <RouterLink to="/"> </RouterLink>
          </button>
        </div>
        <div v-else class="flex flex-col items-center justify-center">
          <button
            @click="
              deleteGame();
              initPlayer();
              useTap2.play();
            "
          >
            <img @load="loadDeathGif()" :src="deathAnimation ? winGif : winImg" />
            <RouterLink to="/"> </RouterLink>
          </button>
        </div>
      </div>

      <!-- 敵の情報と設定系 -->
      <div class="flex fixed z-30 w-auto first-letter: justify-between">
        <div class="flex flex-col">
          <div class="flex justify-start">
            <button @click="devMode = !devMode" class="btn-pop">
              <img :src="configImg" class="w-10" />
            </button>
            <button @click="isBGM = !isBGM" class="btn-pop transform -translate-y-2">
              <img v-if="isBGM" :src="soundOnImg" class="w-16" />
              <img v-else :src="soundOffImg" class="w-16" />
            </button>
            <div class="relative transform -translate-x-3">
              <img :src="turnBackgroundImg" class="w-12 transform translate-y-3" />
              <div class="overText text-2xl font-bold text-left">{{ turn }}</div>
            </div>
          </div>
          <div v-if="devMode" class="flex flex-col fixed top-24">
            <p>{{ "sign: " + sign }}</p>
            <p>{{ components }}</p>
            <button @click="drawRandomOneCard(wantCard)">drawSelectCard</button>
            <input v-model="wantCard" type="number" />
          </div>
        </div>
        <UiEnemyInfo :player="enemyPlayer" :sign="sign" class="ml-auto" :class="isMobile ? 'w-full' : 'w-[320px]'" />
      </div>

      <!-- ショップとバトルのアニメーション -->
      <transition
        appear
        enter-from-class="translate-y-[-150%] opacity-0"
        leave-to-class="translate-y-[150%] opacity-0"
        leave-active-class="transition duration-300"
        enter-active-class="transition duration-300"
      >
        <div class="overlay">
          <div v-if="phase === 'shop'">
            <Shop />
          </div>

          <div v-if="phase === 'battle'">
            <Battle />
          </div>
        </div>
      </transition>

      <!-- このターン両者が使用したカード -->
      <div v-if="components !== 'postBattle'">
        <div style="width: 40vw" class="inset-0 top-1/4 left-0 fixed ml-2">
          <UiUseCard
            :player="sign === firstAtkPlayer ? player : enemyPlayer"
            :firstAtkPlayer="firstAtkPlayer"
            :components="components"
            which="primary"
            v-show="components !== 'secondAtk'"
          />
          <UiUseCard
            :player="sign !== firstAtkPlayer ? player : enemyPlayer"
            :firstAtkPlayer="firstAtkPlayer"
            :components="components"
            which="second"
          />
        </div>

        <!-- 戦闘処理中のカード -->
        <div class="overlay">
          <transition
            appear
            enter-from-class="translate-y-[-150%] opacity-0"
            leave-to-class="translate-y-[150%] opacity-0"
            leave-active-class="transition duration-300"
            enter-active-class="transition duration-300"
            mode="out-in"
          >
            <img v-if="myTurnAnimation" @load="loadMyTurnImg()" :src="myTurnImg" style="width: 40vw" />
            <img v-else-if="enemyTurnAnimation" @load="loadEnemyTurnImg()" :src="enemyTurnImg" style="width: 40vw" />
            <div v-else class="flex flex-col">
              <UiUseCardDisplay
                v-if="sign === firstAtkPlayer"
                :after="battleResult[0]"
                :value="battleResult[1]"
                :cards="components === 'primaryAtk' ? field : enemyPlayer.field"
              />
              <UiUseCardDisplay
                v-if="sign !== firstAtkPlayer"
                :after="battleResult[0]"
                :value="battleResult[1]"
                :cards="components === 'primaryAtk' ? enemyPlayer.field : field"
              />
            </div>
          </transition>
        </div>
      </div>

      <!-- 自分のステータス&ギフト&ミッション&手札の表示 -->
      <div class="bottom-0 fixed flex flex-col" :class="isMobile ? 'w-auto' : 'w-[460px]'">
        <img
          v-if="(cardLock && phase === 'battle' && components === 'postBattle') || (phase === 'shop' && check)"
          :src="waitingGif"
          class="bottom-0 fixed w-[max(50dvw,350px)] -translate-x-[100px] -translate-y-[125px]"
        />
        <div class="flex gap-2 w-auto justify-between">
          <UiStatus :player="player" class="w-full" :class="isMobile ? 'w-auto' : 'w-[430px]'" />
          <div class="w-12 bg-black" />
        </div>
        <UiHand class="pt-5" />
      </div>
    </div>
  </Expanded>
</template>
