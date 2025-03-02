<script setup lang="ts">
import UiGift from "@/components/uiGiftsGift.vue";
import allGifts from "@/assets/allGifts";
import type { PlayerData } from "@/types";

defineProps<{
  gifts: number[];
  player: PlayerData;
  size: "my" | "enemy";
}>();
//!敵味方の区別をつけるならここ｡ないならShopでのGiftにも表示されるようにGiftGiftに移動
</script>

<template>
  <div class="flex mt-auto">
    <div v-for="gift in gifts" :key="gift">
      <div class="relative">
        <UiGift :gift="gift" :size="size" />
        <div v-if="player.status.contribution >= allGifts[gift].requireContribution" class="absolute top-0 right-0">
          <div class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
