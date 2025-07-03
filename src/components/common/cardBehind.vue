<script setup lang="ts">
import type { Card, Attribute } from "@/types";

defineProps<{
  cards: Card[] | undefined;
  rottenCards?: Card[] | undefined;
  attribute?: Attribute;
}>();
</script>
<template>
  <transition leave-to-class="translate-y-[150%] opacity-0" leave-active-class="transition duration-300">
    <div v-if="attribute" class="flex justify-start">
      <div
        v-for="card in cards?.map((card) => {
          if (card.attribute === attribute) {
            return card;
          }
        })"
        :key="card?.id"
      >
        <div class="relative">
          <img v-if="card" :src="`/img/companysBack/${card.company}.png`" class="w-14 h-14" />
        </div>
      </div>
    </div>
    <div v-else class="flex justify-start ml-auto">
      <transition-group
        enter-from-class="translate-y-[-150%] opacity-0"
        leave-to-class="translate-y-[150%] opacity-0"
        leave-active-class="transition duration-300"
        enter-active-class="transition duration-300"
      >
        <div v-for="card in rottenCards" :key="card.id">
          <img v-if="card" :src="`/img/companysBack/nothing.png`" class="w-14 h-14" />
        </div>
        <div class="p-1"></div>
        <div v-show="cards?.length === 0" class="w-14 h-14"></div>
        <div v-for="card in cards" :key="card.id">
          <img v-if="card" :src="`/img/companysBack/${card.company}.png`" class="w-14 h-14" />
        </div>
      </transition-group>
    </div>
  </transition>
</template>
