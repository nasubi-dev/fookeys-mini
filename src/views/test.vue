<script setup lang="ts">
import UiCard from "@/components/uiCard.vue";
import { ref, toRefs, watch, onMounted } from "vue";
import allCards from "@/assets/allCards";
</script>

<template>
  <div class="w-screen h-screen">
    <h1>Test</h1>

    <div class="flex justify-center w-[800px]">
      <UiCard size="normal" :card="allCards[0]" />
      <UiCard size="normal" :card="allCards[1]" />
      <UiCard size="normal" :card="allCards[2]" />
      <UiCard size="normal" :card="allCards[3]" />
      <UiCard size="normal" :card="allCards[4]" />
      <UiCard size="normal" :card="allCards[5]" />
      <UiCard size="normal" :card="allCards[6]" />
    </div>
  </div>
</template>
