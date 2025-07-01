<script setup lang="ts">
import { onMounted, toRefs, ref } from "vue";
import { enemyPlayerStore, playerStore } from "@/main";
import { e, s, i } from "@/log";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import { BATTLE_CONSTANTS } from "@/consts";
import { startShop } from "@/server/useShop";
import allGifts from "@/assets/allGifts";

const { player, phase, sign, components } = storeToRefs(playerStore);
const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { giftActiveId } = toRefs(player.value);
const { giftActiveId: enemyGiftActiveId } = toRefs(enemyPlayer.value);

const props = defineProps<{
  order: "primary" | "second";
}>();

const viewOrder = ref(false);
onMounted(() => {
  if (
    (props.order === "primary" && sign.value === BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST) ||
    (props.order === "second" && sign.value === BATTLE_CONSTANTS.PLAYER_ALLOCATION.SECOND)) {
    viewOrder.value = true;
  } else {
    viewOrder.value = false;
  }
  setTimeout(() => {
    viewOrder.value = !viewOrder.value;
    // components.value = "postBattle";
    // startShop();
  }, 3000);
});
</script>

<template>
  <div>
    <transition appear enter-from-class="translate-y-[-150%] opacity-0" leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300" enter-active-class="transition duration-300">
      <div v-if="phase === 'giftPack' && viewOrder" class="flex flex-col gap-5 p-20 justify-center items-center">
        <img v-if="giftActiveId !== -1" :src="`/img/gifts/${allGifts[giftActiveId].id}.png`" class="w-[320px] min-w-[248px]" />
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
