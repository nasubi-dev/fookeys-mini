<script setup lang="ts">
import { onMounted, toRefs, ref } from "vue";
import { playerStore, gameStore } from "@/main";
import { e, s, i } from "@/log";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import { eatingGif } from "@/assets/gifs";
import { decideImg, sumFieldImg, trash } from "@/assets/img/ui";
import { tap2, battlePhase, swipe } from "@/assets/sounds";
import { BATTLE_CONSTANTS } from "@/consts";

const useTap2 = useSound(tap2);
const useBattlePhase = useSound(battlePhase);
const useSwipe = useSound(swipe);
const { player, cardLock, phase, sumCards, log } = storeToRefs(playerStore);
const { field, rottenHand, isTrash, hand, giftActiveBeforeId, isSaleZeroHungry } = toRefs(player.value);
const { game } = storeToRefs(gameStore);

//ターンを終了時
const turnEnd = (action: "decide" | "trash") => {
  if (action === "trash") {
    // trashを選択した場合はfieldからhandへ戻す
    hand.value = [...hand.value, ...field.value];
    field.value = [];
    // rottenHandから一枚削除
    rottenHand.value.splice(0, 1);
    isTrash.value = true;
  }
  if (cardLock.value) return;
  console.log(i, "turnEnd");
  //cardLockをtrueにする
  cardLock.value = true;
  //!手札がFirestoreに保存するためにhand.vueから移動する
};

const battleAnimation = ref(false);
onMounted(() => {
  if (game.value.turn === 1) return;
  battleAnimation.value = true;
});
const loadBattleGif = () => {
  useBattlePhase.play();
  setTimeout(() => {
    battleAnimation.value = false;
  }, BATTLE_CONSTANTS.WAIT_TIME.BATTLE_PHASE);
};
</script>

<template>
  <div>
    <transition appear enter-from-class="translate-y-[-150%] opacity-0" leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300" enter-active-class="transition duration-300">
      <div v-if="battleAnimation" class="overlay">
        <img @load="loadBattleGif()" :src="eatingGif" />
      </div>
      <div v-else>
        <div v-if="phase === 'battle' && !cardLock" class="flex flex-col gap-5 p-20 justify-center items-center">
          <div class="relative">
            <img :src="sumFieldImg" class="w-[320px] min-w-[248px]" />
            <div class="overText">
              <div class="text-lg font-bold flex w-full justify-between px-6 items-center content-between">
                <p>{{"🍖" + (sumCards.hungry - (isSaleZeroHungry ? field.reduce((acc, card) => (card.isSale
                  ? acc + card.hungry : acc), 0) : 0)) }}</p>
                <p>{{ "⚔" + (sumCards.atk + (giftActiveBeforeId === 5 ? 30 : 0)) }}</p>
                <p>{{ "🛡" + (sumCards.def + (giftActiveBeforeId === 6 ? 40 : 0)) }}</p>
                <p>{{ "💖" + sumCards.heal }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center w-full">
            <div class="w-[80px]" />
            <button @click="
              turnEnd('decide');
            useTap2.play();
            ">
              <img :src="decideImg" class="w-[150px]" />
            </button>
            <button v-if="rottenHand.length > 0" @click="
              turnEnd('trash');
            useTap2.play();
            ">
              <img :src="trash" class="w-[80px] opacity-100" />
            </button>
            <button v-else @click="
              log = '腐ったカードが手札にありません。';
            useTap2.play();
            ">
              <img :src="trash" class="w-[80px] opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
