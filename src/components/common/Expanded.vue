<script setup lang="ts">
import { ref } from "vue";

const isMobile = ref(window.innerWidth <= 480);
</script>

<template>
  <div class="flex justify-center items-center overflow-clip">
    <div class="h-screen" :class="isMobile ? 'w-full' : 'w-[480px]'">
      <div class="w-fit h-fit grid justify-center items-center p-1">
        <slot />
      </div>
    </div>
  </div>
</template>
