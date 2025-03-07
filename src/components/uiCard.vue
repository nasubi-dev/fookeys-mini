<script setup lang="ts">
import { ref, watch } from "vue";
import { useSound } from "@vueuse/sound";
import { popUp } from "@/assets/sounds";
import type { Card } from "@/types";
import VDuringPress from "./VDuringPress.vue";
import bg from "@/assets/img/ui/22x.png";
import { wait } from "@/server/utils";

const p = defineProps<{
  card: Card;
  size: "normal" | "big";
  state?: boolean;
}>();

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

const wastedClass = ref("");
watch(
  () => p.card.waste,
  (newVal, oldVal) => {
    //増えたらshake
    if (newVal < oldVal) {
      wastedClass.value = "animate-jump";
      wait(1000).then(() => {
        wastedClass.value = "animate-stop";
      });
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="">
    <div
      v-if="dropDown"
      class="z-20 mx-3 fixed text-gray-900 text-left"
      :class="[card.description ? `w-[max(20vw,340px)] -translate-y-32` : `w-[max(15vw,180px)] -translate-y-24`, state ? `` : `max-w-fit`]"
    >
      <div :class="[card.description ? `w-[max(20vw,340px)]` : `w-[max(15vw,180px)]`]">
        <img :src="bg" class="z-20 absolute" />
        <div class="z-20 p-4 px-5 absolute">
          <p class="font-bold">{{ card.company + " : " + card.name }}</p>
          <p>{{ card.description }}</p>
        </div>
      </div>
    </div>
    <div class="relative">
      <VDuringPress :onKeyDown="onLongPressCallbackHook" :onKeyUp="onKeyUpCallbackHook" :delay="250">
        <img :src="`/img/companys/${card.company}.png`" class="" />
        <div class="overText">
          <div
            v-if="card.waste"
            class="font-bold text-center select-none"
            :class="[
              size === 'normal'
                ? `text-[min(120%,1.5rem)] -translate-x-[min(7vw,1.9rem)] translate-y-[min(3.5vw,1.3rem)]`
                : `text-[min(170%,1.8rem)] -translate-x-[min(11vw,2.7rem)] translate-y-[min(6vw,1.7rem)]`,
              card.waste === 1 ? `-translate-x-[380%]` : null,
            ]"
          >
            <div :class="wastedClass" class="absolute">
              {{ card.waste }}
            </div>
          </div>
          <div class="p-2" />
          <img
            v-if="card.waste"
            :src="`/img/foods/${card.id}.png`"
            class="transform"
            :class="size === 'normal' ? `-translate-x-1 translate-y-2` : `-translate-x-[10%] translate-y-[20%]`"
          />

          <div
            class="flex font-black text-border-thin transform select-none"
            :class="size === 'normal' ? `text-[min(70%,1rem)] -translate-x-[10%]` : `text-[min(130%,1.5rem)] -translate-x-[10%]`"
          >
            <p v-if="card.hungry !== undefined && card.id !== 0">{{ "🍖" + card.hungry }}</p>
            <p v-if="card.atk">{{ "💪" + card.atk }}</p>
            <p v-if="card.def">{{ "🛡" + card.def }}</p>
            <p v-if="card.tech">{{ "⚡️" + card.tech }}</p>
            <p v-if="card.heal">{{ "💖" + card.heal }}</p>
          </div>
        </div>
        <div v-if="card.description && card.id !== 0" class="absolute" :class="size === 'normal' ? `top-5 right-5` : `top-5 right-5`">
          <img :src="`/img/showSpecial/${card.company}.png`" class="absolute" />
        </div>
      </VDuringPress>
    </div>
  </div>
</template>
