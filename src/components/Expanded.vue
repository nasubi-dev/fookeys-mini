<script setup lang="ts">
import { ref, watch } from "vue";

</script>

<template>
  <div class="w-screen h-screen flex justify-center items-center overflow-clip">
    <div class=" max-w-[480px] w-full h-screen  border-2 border-gray-900">
      <div class="w-fit grid justify-center items-center">
        <slot />
      </div>
    </div>
  </div>
</template>
