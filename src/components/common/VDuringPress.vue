<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { ref } from "vue";

const pressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const p = defineProps<{
  onKeyDown: () => void;
  onKeyUp: () => void;
  delay: number;
}>();

const emit = defineEmits<{
  longPress: [];
}>();

const target = ref(null);

onClickOutside(target, (event) => endPress());

function startPress(): void {
  pressTimer.value = setTimeout(() => {
    p.onKeyDown();
  }, p.delay);

  // 長押し用のタイマー（1秒後に発火）
  longPressTimer.value = setTimeout(() => {
    emit("longPress");
  }, 500);
}

function endPress(): void {
  p.onKeyUp();
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
}
</script>

<template>
  <div ref="target" @pointerdown="startPress" @click="endPress" @contextmenu.prevent>
    <slot />
  </div>
</template>
