<script setup lang="ts">
import { ref, watch } from "vue";
import type { PlayerData } from "@/types";
import Character from "./character.vue";
import uiCardBehind from "./uiCardBehind.vue";
import enemyStatusImg from "@/assets/img/ui/enemyStatus.png";
import GiftPackEnemy from "./GiftPackEnemy.vue";

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
    //減ったらjump
    // if (newVal.hp < oldVal.hp) hpClass.value = "animate-shake"
    if (newVal.hungry < oldVal.hungry) hungryClass.value = "animate-shake";
  },
  { deep: true }
);
</script>

<template>
  <div class="flex flex-col">
    <div class="flex justify-end">
      <uiCardBehind :cards="player.hand" :rottenCards="player.rottenHand" />
    </div>

    <div class="relative w-full" :class="wiggleClass">
      <img :src="enemyStatusImg" />
      <div class="overText w-full">
        <div class="flex flex-row-reverse justify-center items-center w-full">
          <Character status="enemy" class="ml-auto" @isWiggle="wiggleStatus" />
          <div class="flex justify-start font-bold text-[min(4vw,1.2rem)] h-4/5 text-gray-900 pl-4">
            <div :class="hpClass">❤{{ player.status.hp + "/" + player.status.maxHp }}</div>
            <div :class="hungryClass">🍖{{ player.status.hungry + "/" + player.status.maxHungry }}</div>
          </div>
        </div>
      </div>
      <GiftPackEnemy class="w-[min(100vw,100px)] pt-10" />
    </div>
  </div>
</template>
