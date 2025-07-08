<script setup lang="ts">
import { ref, watch } from "vue";
import type { PlayerData } from "@/types";
import Character from "@/components/static/character.vue";
import statusImg from "@/assets/img/ui/status.webp";

const p = defineProps<{ player: PlayerData }>();

const wiggleClass = ref();
const wiggleStatus = (reactionImg: string) => {
  wiggleClass.value = reactionImg === "damage" ? "animate-wiggle animate-once" : null;
};

const hpClass = ref();
const hungryClass = ref();
watch(
  () => p.player.status,
  (newVal, oldVal) => {
    //初期化
    hpClass.value = hungryClass.value = null;
    //増えたらshake
    if (newVal.hp > oldVal.hp) hpClass.value = "animate-jump";
    if (newVal.hungry > oldVal.hungry) hungryClass.value = "animate-jump";
    if (newVal.hungry < oldVal.hungry) hungryClass.value = "animate-shake";
  },
  { deep: true }
);
</script>

<template>
  <div class="relative mt-auto" :class="wiggleClass">
    <img :src="statusImg" class="w-[min(80vw,380px)]" />
    <div class="absolute inset-0 flex align-top justify-start pb-2">
      <div class="flex justify-start w-[min(80vw,380px)]">
        <Character status="my" @isWiggle="wiggleStatus" class="w-[min(20vw,120px)]" />
        <div class="flex font-bold text-gray-900 text-[min(4vw,1.2rem)] mb-2 mt-auto select-none">
          <div :class="hpClass">❤:{{ player.status.hp + "/" + player.status.maxHp }}</div>
          <div :class="hungryClass">🍖:{{ player.status.hungry + "/" + player.status.maxHungry }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
