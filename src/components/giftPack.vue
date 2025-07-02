<script setup lang="ts">
import { onMounted, toRefs, ref } from "vue";
import { enemyPlayerStore, playerStore } from "@/main";
import { e, s, i } from "@/log";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import { BATTLE_CONSTANTS } from "@/consts";
import allGifts from "@/assets/allGifts";
import { giftCheck } from "@/server/useBattleUtils";
import { success } from "@/assets/sounds";
const { player, phase, sign } = storeToRefs(playerStore);
const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { giftActiveId } = toRefs(player.value);
const { giftActiveId: enemyGiftActiveId } = toRefs(enemyPlayer.value);

const useSuccess = useSound(success);


const viewOrder = ref(false);
let order: "primary" | "second" = sign.value === BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST ? "primary" : "second";
onMounted(() => {
  if (
    (order === "primary")) {
    viewOrder.value = true;
    giftCheck(order);
  } else {
    viewOrder.value = false;
    giftCheck(order);
  }
  setTimeout(() => {
    viewOrder.value = !viewOrder.value;
    giftCheck(order==="primary" ? "second" : "primary");
  }, 2000);
});
</script>

<template>
  <div>
    <transition appear enter-from-class="translate-y-[-150%] opacity-0" leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300" enter-active-class="transition duration-300">
      <div v-if="phase === 'giftPack' && viewOrder" class="flex flex-col gap-5 p-20 justify-center items-center">
        <img v-if="giftActiveId !== -1" :src="`/img/gifts/${allGifts[giftActiveId].id}.png`"
          class="w-[320px] min-w-[248px]" />
      </div>
    </transition>
    <transition appear enter-from-class="translate-y-[-150%] opacity-0" leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300" enter-active-class="transition duration-300">
      <div v-if="phase === 'giftPack' && !viewOrder" class="flex flex-col gap-5 p-20 justify-center items-center">
        <img v-if="enemyGiftActiveId !== -1" :src="`/img/gifts/${allGifts[enemyGiftActiveId].id}.png`"
          class="w-[320px] min-w-[248px]" />
      </div>
    </transition>
  </div>
</template>
