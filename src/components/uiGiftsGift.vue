<script setup lang="ts">
import { ref } from "vue";
import { useSound } from "@vueuse/sound";
import { popUp } from "@/assets/sounds";
import VDuringPress from "./VDuringPress.vue";
import allGifts from "@/assets/allGifts";
import bg from "@/assets/img/ui/22x.png";

defineProps<{ gift: number; size: "my" | "enemy" }>();

const usePopUp = useSound(popUp);

const dropDown = ref(false);
const onLongPressCallbackHook = (): void => {
  console.log("longPress");
  dropDown.value = true;
  usePopUp.play();
};
const onKeyUpCallbackHook = (): void => {
  dropDown.value = false;
};
</script>

<template>
  <div class="mt-auto mx-1">
    <div
      v-if="dropDown"
      class="fixed z-20 p-2 w-[max(20vw,340px)] whitespace-pre-wrap transform"
      :class="[size === 'my' ? '-translate-y-32' : 'translate-y-12  -translate-x-32']"
    >
      <div class="absolute w-[max(20vw,340px)]">
        <img :src="bg" class="z-20 absolute w-[max(20vw,340px)]" />
        <div class="z-20 p-4 w-[max(20vw,340px)] px-6 absolute">
          <div class="flex flex-row mb-1 font-bold text-gray-900">
            <p>{{ allGifts[gift]?.name }}</p>
            <p class="ml-auto">{{ "🪙 " + allGifts[gift]?.requireContribution }}</p>
          </div>
          <p class="w-full">{{ allGifts[gift]?.description }}</p>
        </div>
      </div>
    </div>
    <VDuringPress :onKeyDown="onLongPressCallbackHook" :onKeyUp="onKeyUpCallbackHook" :delay="250">
      <img :src="`/img/gifts/${gift}.png`" class="" />
    </VDuringPress>
  </div>
</template>
