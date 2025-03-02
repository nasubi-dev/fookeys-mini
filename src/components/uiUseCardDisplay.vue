<script setup lang="ts">
import { e, s, i } from "@/log";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import type { Card } from "@/types";
import UiCard from "./uiCard.vue";

const { cardLock } = storeToRefs(playerStore);

defineProps<{
  cards: Card[];
  value: number | string;
  after: number | string;
}>();
</script>

<template>
  <div class="flex items-center">
    <div v-if="cardLock" class="text-5xl font-bold text-border text-gray-900">
      <p v-if="after === 'hungry'" class="animate-jump animate-once">{{ value ? "行動不能✖" : "行動可能✔" }}</p>
      <p v-if="after === 'donate' && value" class="animate-jump animate-once">{{ "🪙" + value }}</p>
      <p v-if="after === 'heal' && value" class="animate-jump animate-once">{{ "💖" + value }}</p>
      <p v-if="after === 'def' && value" class="animate-jump animate-once">{{ "🛡" + value }}</p>
      <p v-if="after === 'atk' && value" class="animate-jump animate-once">{{ "💪" + value }}</p>
      <p v-if="after === 'tech' && value" class="animate-jump animate-once">{{ "⚡️" + value }}</p>
    </div>
    <div
      class="flex justify-start"
      v-for="card in after === 'donate'
        ? cards
        : cards.map((card) => {
            if (card.attribute === after) {
              return card;
            }
          })"
      :key="card?.id"
    >
      <div v-if="card" style="width: 15vw">
        <UiCard :card="card" size="big" />
      </div>
    </div>
  </div>
</template>
