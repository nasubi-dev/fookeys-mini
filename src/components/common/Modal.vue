<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title?: string;
  noBackground?: boolean; // 背景を無効化
  noCloseButton?: boolean; // バツボタンを無効化
  noPadding?: boolean; // パディングを無効化
  noBorder?: boolean; // ボーダーを無効化
  noWhiteBackground?: boolean; // 白背景を無効化
}

interface Emits {
  (e: "close"): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center">
      <div v-if="!noBackground" class="absolute inset-0 bg-black bg-opacity-50"></div>

      <div
        class="relative max-w-lg w-full mx-4 max-h-[90vh] overflow-auto"
        :class="noWhiteBackground ? '' : 'bg-white rounded-lg shadow-xl'"
      >
        <div v-if="title || !noCloseButton" class="flex items-center justify-between border-b" :class="noPadding ? '' : 'p-4'">
          <h3 v-if="title" class="text-lg font-semibold text-gray-900">
            {{ title }}
          </h3>
          <div v-else></div>

          <button v-if="!noCloseButton" @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div :class="noPadding ? '' : 'p-4'">
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>
