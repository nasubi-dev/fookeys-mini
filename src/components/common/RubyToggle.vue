<!-- <script setup lang="ts">
import { ref, onMounted } from 'vue';

const isRubyVisible = ref(true);

onMounted(() => {
  // RubyfulV2の初期化を待つ
  const checkRubyful = setInterval(() => {
    if (typeof (window as any).RubyfulV2 !== 'undefined') {
      clearInterval(checkRubyful);
      console.log('RubyfulV2 is ready');
      isRubyVisible.value = true;

      // 初期状態でルビを表示
      setTimeout(() => {
        if ((window as any).RubyfulV2.show) {
          (window as any).RubyfulV2.show();
        }
      }, 300);
    }
  }, 100);
});

const toggleRuby = () => {
  if (typeof (window as any).RubyfulV2 !== 'undefined') {
    try {
      (window as any).RubyfulV2.toggle();
      isRubyVisible.value = !isRubyVisible.value;
      console.log('Ruby toggled:', isRubyVisible.value ? 'ON' : 'OFF');
    } catch (error) {
      console.error('Toggle error:', error);
    }
  } else {
    console.warn('RubyfulV2 not available');
  }
};
</script>

<template>
  <button @click="toggleRuby"
    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 pointer-events-auto select-none text-sm font-bold">
    <span class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span>{{ isRubyVisible ? 'ルビ ON' : 'ルビ OFF' }}</span>
    </span>
  </button>
</template> -->
