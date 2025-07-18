<script setup lang="ts">
import { ref, computed } from "vue";
import Modal from "./Modal.vue";

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const currentPage = ref(1);
const totalPages = 11;

const currentImage = computed(() => {
  const pageNumber = currentPage.value < 10 ? `0${currentPage.value}` : `${currentPage.value}`;
  return `/img/tutorial/mini-${pageNumber}.webp`;
});

const isFirstPage = computed(() => currentPage.value === 1);
const isLastPage = computed(() => currentPage.value === totalPages);

const nextPage = () => {
  if (currentPage.value < totalPages) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const completeTutorial = () => {
  localStorage.setItem("tutorial_completed", "true");
  currentPage.value = 1;
  emit("close");
};
</script>

<template>
  <Modal
    :is-open="isOpen"
    :title="`fookeysの遊び方 ${currentPage}/${totalPages}`"
    @close="
      $emit('close');
      completeTutorial();
    "
  >
    <div class="flex flex-col items-center">
      <div class="mb-6">
        <img
          :src="currentImage"
          :alt="`チュートリアル ${currentPage}/${totalPages}`"
          class="max-w-full max-h-[70vh] object-contain"
        />
      </div>

      <div class="flex gap-4">
        <button
          @click="prevPage"
          :disabled="isFirstPage"
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-colors duration-200',
            isFirstPage ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600 text-white',
          ]"
        >
          前へ
        </button>

        <button
          v-if="!isLastPage"
          @click="nextPage"
          class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200"
        >
          次へ
        </button>

        <button
          v-else
          @click="completeTutorial"
          class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200"
        >
          完了
        </button>
      </div>
    </div>
  </Modal>
</template>
