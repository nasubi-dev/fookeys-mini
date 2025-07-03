<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { ref } from "vue";

const pressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const p = defineProps<{
  onKeyDown: () => void;
  onKeyUp: () => void;
  delay: number;
}>();

const target = ref(null);

onClickOutside(target, (event) => endPress());

function startPress(): void {
  pressTimer.value = setTimeout(() => {
    p.onKeyDown();
  }, p.delay);
}
function endPress(): void {
  p.onKeyUp();
  if (!pressTimer.value) return;
  clearTimeout(pressTimer.value);
  pressTimer.value = null;
}
</script>

<template>
  <div ref="target" @pointerdown="startPress" @click="endPress" @contextmenu.prevent>
    <slot />
  </div>
</template>
