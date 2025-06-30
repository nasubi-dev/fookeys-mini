<script setup lang="ts">
import { onMounted, toRefs, ref } from "vue";
import { enemyPlayerStore, playerStore } from "@/main";
import { e, s, i } from "@/log";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import { tap2, battlePhase, swipe } from "@/assets/sounds";
import { BATTLE_CONSTANTS } from "@/consts";
import allGifts from "@/assets/allGifts";


const useTap2 = useSound(tap2);
const useBattlePhase = useSound(battlePhase);
const useSwipe = useSound(swipe);
const { player, cardLock, phase } = storeToRefs(playerStore);
const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { giftActiveId } = toRefs(player.value);
const { giftActiveId: enemyGiftActiveId } = toRefs(enemyPlayer.value);

//ターンを終了時
const turnEnd = () => {
  if (cardLock.value) return;
  console.log(i, "turnEnd");
  //cardLockをtrueにする
  cardLock.value = true;
  //!手札がFirestoreに保存するためにhand.vueから移動する
};

const viewOrder = ref(false);
onMounted(() => {
  viewOrder.value = true;
  setTimeout(() => {
    viewOrder.value = false;
    useSwipe.play();
  }, BATTLE_CONSTANTS.WAIT_TIME.DEATH_ANIMATION);
});
</script>

<template>
  <div>
    <transition appear enter-from-class="translate-y-[-150%] opacity-0" leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300" enter-active-class="transition duration-300">
      <div v-if="phase === 'giftPack'" class="flex flex-col gap-5 p-20 justify-center items-center">
        <div class="relative">
          <img :src="`/img/gifts/${allGifts[giftActiveId].id}.png`" class="w-[320px] min-w-[248px]" />
          <div class="overText">
            <div class="text-lg font-bold flex w-full justify-between px-6 items-center content-between">
              {{ allGifts[giftActiveId].name }}
            </div>
          </div>
        </div>
      </div>

    </transition>
  </div>
</template>
