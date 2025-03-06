<script setup lang="ts">
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";

const { isMobile } = storeToRefs(playerStore);
</script>

<template>
  <div class="flex justify-center items-center overflow-clip">
    <div class=" w-full h-screen border-2 border-gray-900" :class="isMobile ? 'w-full' : 'w-[480px]'">
      <div class="w-fit h-fit grid justify-center items-center p-1">
        <slot />
      </div>
    </div>
  </div>
</template>
