<script setup lang="ts">
import { ref, watch } from "vue";
import type { PlayerData } from "@/types";
import Character from "./character.vue";
import statusImg from "@/assets/img/ui/status.png";

const p = defineProps<{ player: PlayerData }>();

const wiggleClass = ref();
const wiggleStatus = (reactionImg: string) => {
  wiggleClass.value = reactionImg === "damage" ? "animate-wiggle animate-once" : null;
};

const hpClass = ref();
const hungryClass = ref();
const contributionClass = ref();
watch(
  () => p.player.status,
  (newVal, oldVal) => {
    //初期化
    hpClass.value = hungryClass.value = contributionClass.value = null;
    //増えたらshake
    if (newVal.hp > oldVal.hp) hpClass.value = "animate-jump";
    if (newVal.hungry > oldVal.hungry) hungryClass.value = "animate-jump";
    if (newVal.contribution > oldVal.contribution) contributionClass.value = "animate-jump";
    if (newVal.hungry < oldVal.hungry) hungryClass.value = "animate-shake";
    if (newVal.contribution < oldVal.contribution) contributionClass.value = "animate-shake";
  },
  { deep: true }
);
</script>

<template>
  <div class="relative mt-auto w-[max(40vw,500px)]" :class="wiggleClass">
    <img :src="statusImg" />
    <div class="overText w-full pb-32">
      <div class="flex justify-start w-full transform">
        <Character status="my" @isWiggle="wiggleStatus" class="w-[min(18vw,250px)] mt-10" />
        <div class="flex justify-start font-bold text-gray-900 w-[calc(max(40vw,500px) - 300px)] text-[min(2vw,3rem)] mt-auto ml-auto mr-8 select-none">
          <div :class="hpClass">❤:{{ player.status.hp + "/" + player.status.maxHp }}</div>
          <div :class="hungryClass">🍖:{{ player.status.hungry + "/" + player.status.maxHungry }}</div>
          <div :class="contributionClass">🪙:{{ player.status.contribution }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
