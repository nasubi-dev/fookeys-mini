<script setup lang="ts">
import { onMounted, toRefs, watch, ref, onUnmounted, defineAsyncComponent } from "vue";
import { usePush, Notivue, Notifications, filledIcons } from "notivue";
import { useSound } from "@vueuse/sound";
import { playerStore, enemyPlayerStore, gameStore } from "@/main";
import { storeToRefs } from "pinia";
import { useModalStore } from "@/store";
import { e, s, i } from "@/log";
import { intervalForEach, wait, XOR } from "@/server/utils";
import { getEnemyPlayer, initPlayer } from "@/server/usePlayerData";
import { deleteGame, watchDeleteGame } from "@/server/useMatchMaking";
import { drawOneCard } from "@/server/useShopUtils";
import { startShop } from "@/server/useShop";
import { BATTLE_CONSTANTS } from "@/consts";
import Expanded from "@/components/common/Expanded.vue";
import Modal from "@/components/common/Modal.vue";
import UiEnemyInfo from "@/components/static/enemyInfo.vue";
import Tutorial from "@/components/common/Tutorial.vue";
import UiStatus from "@/components/static/status.vue";
import UiHand from "@/components/static/hand.vue";
import Battle from "@/components/flexible/battle.vue";
import GiftPack from "@/components/flexible/giftPack.vue";
import uiGiftPack from "@/components/static/giftPack.vue";
import { winImg, loseImg, myTurnImg, enemyTurnImg, configImg, soundOnImg, soundOffImg, turnBackgroundImg, back } from "@/assets/img/ui";
import { waitingGif, startGif, winGif, loseGif } from "@/assets/gifs";
import {
  tap2,
  enemyTurn,
  myTurn,
  battleStart,
  atk,
  def,
  tech,
  hp,
  sup,
  rotten,
  gaugeDown,
  gaugeUp,
  gaugeMax,
  bgm,
  win,
  lose,
  success,
} from "@/assets/sounds";

const Shop = defineAsyncComponent(() => import("@/components/flexible/shop.vue"));
const UiUseCard = defineAsyncComponent(() => import("@/components/flexible/useCard.vue"));
const UiUseCardDisplay = defineAsyncComponent(() => import("@/components/flexible/useCardDisplay.vue"));
const myLogImg = defineAsyncComponent(() => import("@/components/common/myLog.vue"));
const enemyLogImg = defineAsyncComponent(() => import("@/components/common/enemyLog.vue"));

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
const useGaugeDown = useSound(gaugeDown);
const useGaugeUp = useSound(gaugeUp);
const useGaugeMax = useSound(gaugeMax);
const useSuccess = useSound(success);

const { id, player, cardLock, phase, offer, sign, log, myLog, enemyLog, sumCards, isMobile, components, battleResult } =
  storeToRefs(playerStore);
const {
  idGame,
  idEnemy,
  match,
  character,
  status,
  hand,
  rottenHand,
  death,
  field,
  sumFields,
  name,
  check,
  giftPackGauge,
  giftPackTotal,
  giftPackCounter,
} = toRefs(player.value);
const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { game } = storeToRefs(gameStore);
const { players, turn, firstAtkPlayer } = toRefs(game.value);

// Modal store
const modalStore = useModalStore();
const { openModal, closeModal, getModal } = modalStore;

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

  const isLose = status.value.hp <= 0;
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
    }, BATTLE_CONSTANTS.WAIT_TIME.SHOP_DELAY);
  }
});
watch(giftPackTotal, (newVal, oldVal) => {
  // ギフトパックが100ごとにMaxを再生 減少して420 → 400のように減少した場合は再生しない
  if (newVal >= BATTLE_CONSTANTS.GIFT_PACK_GAUGE_MAX && oldVal < BATTLE_CONSTANTS.GIFT_PACK_GAUGE_MAX) {
    useGaugeMax.play();
  } else if (newVal > oldVal) {
    useGaugeUp.play();
  } else if (newVal < oldVal) {
    useGaugeDown.play();
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
    while (enemyPlayer.value.hand === undefined) {
      await getEnemyPlayer();
      console.log(i, "Waiting for enemy hand data...");
      await wait(1000);
    }
  }, BATTLE_CONSTANTS.WAIT_TIME.BATTLE_ANIMATION);
  await startShop().then(() => {
    console.log(i, "gameId: ", idGame.value);
    console.log(i, "player1: ", players.value[0], "player2: ", players.value[1]);
    console.log(i, "your id: ", id.value, "your sign: ", sign.value);
    console.log(i, "character: ", character.value);
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
  }, BATTLE_CONSTANTS.WAIT_TIME.TURN_ANIMATION);
};
const loadEnemyTurnImg = () => {
  setTimeout(() => {
    enemyTurnAnimation.value = false;
  }, BATTLE_CONSTANTS.WAIT_TIME.TURN_ANIMATION);
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
  }, BATTLE_CONSTANTS.WAIT_TIME.DEATH_ANIMATION);
};
const startAnimation = ref(true);
const loadStartGif = () => {
  setTimeout(() => {
    startAnimation.value = false;
  }, BATTLE_CONSTANTS.WAIT_TIME.BATTLE_ANIMATION);
};
const wantCard = ref(); //!test用
const devMode = ref(false);

const showTutorial = ref(false);
const openTutorial = () => {
  showTutorial.value = true;
};

const closeTutorial = () => {
  showTutorial.value = false;
};
</script>

<template>
  <Expanded>
    <Notivue v-slot="item">
      <Notifications :item="item" :icons="customIcons" />
    </Notivue>
    <div class="w-full">
      <img v-if="startAnimation" @load="loadStartGif()" :src="startGif" class="overlay object-contain aspect-square z-10" />
      <!-- 勝敗結果Modal -->

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
            <button @click="drawOneCard(wantCard)">drawSelectCard</button>
            <input v-model="wantCard" type="number" />
            <button
              @click="openTutorial()"
              class="btn-pop my-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg px-6 py-3"
            >
              チュートリアル
            </button>
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

          <div v-if="phase === 'giftPack'">
            <GiftPack />
          </div>
        </div>
      </transition>

      <!-- このターン両者が使用したカード -->
      <div v-if="components !== 'postBattle' && components !== 'giftPack'">
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

      <!-- 使用カードの表示 -->
      <div v-if="components !== 'postBattle' && components !== 'giftPack'">
        <div class="w-[460px] h-screen justify-center items-center">
          <div class="w-auto fixed bottom-1/4 ml-2">
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
        </div>
      </div>

      <!-- 自分のステータス&ギフト&ミッション&手札の表示 -->
      <div class="bottom-0 fixed flex flex-col" :class="isMobile ? 'w-auto' : 'w-[460px]'">
        <img
          v-if="(cardLock && phase === 'battle' && components === 'postBattle') || (phase === 'shop' && check)"
          :src="waitingGif"
          class="w-[max(70vw,400px)] -translate-x-[80px] translate-y-[130px]"
        />
        <div class="flex gap-2">
          <UiStatus :player="player" :class="isMobile ? 'w-auto' : 'w-[min(80vw,380px)]'" />
          <uiGiftPack class="w-[min(15vw,80px)]" :status="`my`" />
        </div>
        <UiHand class="pt-5" />
      </div>
    </div>

    <!-- ギフトパック情報Modal -->
    <Modal
      v-if="getModal('myGiftPack').value"
      :is-open="getModal('myGiftPack').value?.isOpen || false"
      :title="getModal('myGiftPack').value?.title"
      @close="closeModal('myGiftPack')"
    >
      <div class="text-center p-4">
        <div class="text-blue-600 text-xl font-bold mb-4">ギフトパック情報</div>
        <div class="space-y-3">
          <div class="bg-gray-100 p-3 rounded">
            <p class="font-semibold">ギフト使用回数</p>
            <p class="text-blue-600 text-2xl font-bold">{{ giftPackCounter.giftActiveCount }}</p>
          </div>
          <div class="bg-gray-100 p-3 rounded">
            <p class="font-semibold"></p>
            <div class="text-md space-y-1">
              <p>通常カード使用数: {{ giftPackCounter.usedCard }}</p>
              <p>セールカード使用数: {{ giftPackCounter.usedSaleCard }}</p>
              <p>一度に3社カード使用数: {{ giftPackCounter.used3CompanyCard }}</p>
              <p>手札を0枚にした: {{ giftPackCounter.hand0Card }}</p>
              <p>同じ会社カード非所持数: {{ giftPackCounter.haveNotSameCompanyCard }}</p>
              <p>腐らせたカード数: {{ giftPackCounter.rottenCard }}</p>
              <p>腐ったカード保持数: {{ giftPackCounter.haveRottenCard }}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- 勝敗結果Modal -->
    <Modal
      v-if="death"
      :is-open="true"
      :title="''"
      :no-background="false"
      :no-close-button="true"
      :no-padding="true"
      :no-white-background="true"
      @close="
        () => {
          deleteGame();
          initPlayer();
          useTap2.play();
          $router.push('/menu');
        }
      "
    >
      <div class="text-center overflow-hidden max-w-[480px] align-middle">
        <div
          v-if="
            status.hp <= 0 ||
            hand.reduce((acc, cur) => {
              if (cur.id === 0) acc++;
              return acc;
            }, 0) >= BATTLE_CONSTANTS.MAX_HAND_SIZE
          "
          class=""
        >
          <img @load="loadDeathGif()" :src="deathAnimation ? loseGif : loseImg" class="max-w-[480px] mx-auto mb-4" />
        </div>
        <div v-else class="">
          <img @load="loadDeathGif()" :src="deathAnimation ? winGif : winImg" class="max-w-[480px] mx-auto mb-4" />
        </div>
        <button
          @click="
            deleteGame();
            initPlayer();
            useTap2.play();
            $router.push('/menu');
          "
        >
          <img :src="back" class="w-32" />
        </button>
      </div>
    </Modal>

    <Modal
      v-if="getModal('enemyGiftPack').value"
      :is-open="getModal('enemyGiftPack').value?.isOpen || false"
      :title="getModal('enemyGiftPack').value?.title"
      @close="closeModal('enemyGiftPack')"
    >
      <div class="text-center p-4">
        <div class="text-red-600 text-xl font-bold mb-4">ギフトパック情報</div>
        <div class="space-y-3">
          <div class="bg-gray-100 p-3 rounded">
            <p class="font-semibold">ギフト使用回数</p>
            <p class="text-2xl font-bold text-red-600">{{ enemyPlayer.giftPackCounter.giftActiveCount }}</p>
          </div>
          <div class="bg-gray-100 p-3 rounded">
            <div class="text-sm space-y-1">
              <p>通常カード使用数: {{ enemyPlayer.giftPackCounter.usedCard }}</p>
              <p>セールカード使用数: {{ enemyPlayer.giftPackCounter.usedSaleCard }}</p>
              <p>一度に3社カード使用数: {{ enemyPlayer.giftPackCounter.used3CompanyCard }}</p>
              <p>手札を0枚にした: {{ enemyPlayer.giftPackCounter.hand0Card }}</p>
              <p>同じ会社カード非所持数: {{ enemyPlayer.giftPackCounter.haveNotSameCompanyCard }}</p>
              <p>腐らせたカード数: {{ enemyPlayer.giftPackCounter.rottenCard }}</p>
              <p>腐ったカード保持数: {{ enemyPlayer.giftPackCounter.haveRottenCard }}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
    <Tutorial :is-open="showTutorial" @close="closeTutorial" />
  </Expanded>
</template>
