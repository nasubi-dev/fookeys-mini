<script setup lang="ts">
import { e, s, i } from "@/log";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import type { Card } from "@/types";
import UiCard from "@/components/common/card.vue";

const { cardLock } = storeToRefs(playerStore);

defineProps<{
  cards: Card[];
  value: number | string;
  after: number | string;
}>();
</script>

<template>
  <div class="flex flex-col gap-3 items-center">
    <div v-if="cardLock" class="text-5xl font-bold text-border text-gray-900">
      <p v-if="after === 'hungry'" class="animate-jump animate-once">{{ value ? "行動不能✖" : "行動可能✔" }}</p>
      <p v-if="after === 'heal' && value" class="animate-jump animate-once">{{ "💖" + value }}</p>
      <p v-if="after === 'def' && value" class="animate-jump animate-once">{{ "🛡" + value }}</p>
      <p v-if="after === 'atk' && value" class="animate-jump animate-once">{{ "💪" + value }}</p>
      <p v-if="after === 'tech' && value" class="animate-jump animate-once">{{ "⚡️" + value }}</p>
    </div>
    <div class="flex items-center">
      <div
        class="flex justify-start"
        v-for="(card, index) in after === 'donate'
          ? cards
          : cards.map((card) => {
              if (card.attribute === after) {
                return card;
              }
            })"
        :key="card?.id"
      >
        <div v-if="card" class="max-w-[400px]">
          <UiCard :card="card" size="big" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>
