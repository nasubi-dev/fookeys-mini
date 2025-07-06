<script setup lang="ts">
import { onMounted, toRefs, ref } from "vue";
import { enemyPlayerStore, playerStore, gameStore } from "@/main";
import { e, s, i } from "@/log";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import { BATTLE_CONSTANTS } from "@/consts";
import allGifts from "@/assets/allGifts";
import { giftCheck } from "@/server/useBattleUtils";
import { success } from "@/assets/sounds";
import { wait } from "@/server/utils";
import { startShop } from "@/server/useShop";
import { finalizeTurn } from "@/server/useBattle";
const { player, phase, sign, components, id } = storeToRefs(playerStore);
const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { game } = storeToRefs(gameStore);

const { giftActiveId, giftActiveBeforeId, check, giftPackCounter, giftPackGauge, idGame, isTrash, sumFields } = toRefs(player.value);
const { giftActiveId: enemyGiftActiveId } = toRefs(enemyPlayer.value);
const { firstAtkPlayer } = toRefs(game.value);

const useSuccessFirst = useSound(success);
const useSuccessSecond = useSound(success);

const viewOrder = ref(false);
let test;
let order: "primary" | "second" = sign.value === BATTLE_CONSTANTS.PLAYER_ALLOCATION.FIRST ? "primary" : "second";
const shiftShopPhase = async () => {
  components.value = "postBattle";
  await finalizeTurn(id.value, idGame.value, sign.value, check, firstAtkPlayer, giftPackGauge, giftPackCounter, giftActiveId, giftActiveBeforeId, isTrash, sumFields);
  await startShop();
}
onMounted(async () => {
  if (giftActiveId.value === -1 && enemyGiftActiveId.value === -1) {
    shiftShopPhase();
    return;
  }
  viewOrder.value = (order === "primary") ? true : false;
  await wait(500);
  test = giftCheck(order);
  if (test !== 0) useSuccessFirst.play();

  setTimeout(async () => {
    viewOrder.value = !viewOrder.value;
    test = giftCheck(order === "primary" ? "second" : "primary");
    if (test !== 0) useSuccessSecond.play();
    await wait(2000);
    await shiftShopPhase();
  }, 3000);
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
