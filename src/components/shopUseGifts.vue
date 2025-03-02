<script setup lang="ts">
import { toRefs, ref, onMounted } from "vue";
import { e, s, i } from "@/log";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { watchShopEnd } from "@/server/useShop";
import decide from "@/assets/img/ui/decide.png";
import allGifts from "@/assets/allGifts";
import UiGiftsGift from "./uiGiftsGift.vue";
import back from "@/assets/img/ui/back.png";

import { useSound } from "@vueuse/sound";
import { tap1, tap2 } from "@/assets/sounds";
const useTap1 = useSound(tap1);
const useTap2 = useSound(tap2);

const { player, log } = storeToRefs(playerStore);
const { gifts, status, isSelectedGift } = toRefs(player.value);

const pushed = ref(false);
onMounted(() => {
  pushed.value = false;
});
const emit = defineEmits<{
  (event: "cancel"): void;
}>();

const selectGift = (gift: number) => {
  if (status.value.contribution < allGifts[gift].requireContribution) {
    log.value = "貢献度が足りなくて" + allGifts[gift].name + "が使えない！";
  } else if (isSelectedGift.value === gift) {
    isSelectedGift.value = undefined;
  } else {
    isSelectedGift.value = gift;
  }
};
const useGift = async () => {
  pushed.value = true;
  await watchShopEnd();
};
</script>

<template>
  <div>
    <transition-group
      enter-from-class="translate-y-[-150%] opacity-0"
      leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300"
      enter-active-class="transition duration-300"
    >
      <div v-if="!pushed" class="flex justify-center">
        <button
          @click="
            emit('cancel');
            isSelectedGift = undefined;
            useTap2.play();
          "
          class="ml-3"
          style="width: 20vw"
        >
          <img :src="back" />
        </button>
        <button
          @click="
            useGift();
            useTap2.play();
          "
        >
          <img :src="decide" style="width: 20vw" />
        </button>
        <div class="flex items-center w-1/3 text-left">
          <div v-for="gift in gifts" :key="gift">
            <div :class="isSelectedGift === gift ? 'transform -translate-y-5' : null">
              <button
                @click="
                  selectGift(gift);
                  useTap1.play();
                "
              >
                <UiGiftsGift size="my" :gift="gift" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>
