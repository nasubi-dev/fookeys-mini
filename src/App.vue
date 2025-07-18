<script setup lang="ts">
import { RouterView } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const isKeyboardOpen = ref(false);
const initialViewportHeight = ref(0);

//ピンチアウト禁止
const touchHandler = (event: any) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
};

//ダブルタップズーム禁止
let lastTouchEnd = 0;
const handleTouchEnd = (event: any) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
};

//テキスト選択禁止
const disableTextSelection = () => {
  return false;
};

//右クリック・長押しメニュー禁止（画像検索などを防ぐ）
const handleContextMenu = (event: any) => {
  event.preventDefault();
};

//スクロール禁止（indexページまたはキーボード表示時は除く）
const disableScroll = (event: any) => {
  // indexページ（home）の場合はスクロールを許可
  if (route.name === 'home' || isKeyboardOpen.value) {
    return;
  }
  event.preventDefault();
};

// キーボードの表示・非表示を検出
const detectKeyboard = () => {
  const currentHeight = window.visualViewport?.height || window.innerHeight;
  const heightDifference = initialViewportHeight.value - currentHeight;

  // 高さの差が100px以上の場合、キーボードが表示されていると判定
  if (heightDifference > 100) {
    if (!isKeyboardOpen.value) {
      isKeyboardOpen.value = true;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    }
  } else {
    if (isKeyboardOpen.value) {
      // キーボードが閉じられた時の処理
      isKeyboardOpen.value = false;
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);

      // 元の表示に戻すための追加処理
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 100);
    }
  }
};

// フォーカスイベントでのキーボード検出
const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    setTimeout(() => {
      detectKeyboard();
    }, 300);
  }
};

const handleFocusOut = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    setTimeout(() => {
      detectKeyboard();
    }, 300);
  }
};

// Visual Viewport APIを使用した検出
const handleVisualViewportChange = () => {
  detectKeyboard();
};

// リサイズイベントでの検出（fallback）
const handleResize = () => {
  detectKeyboard();
};

onMounted(() => {
  // 初期ビューポート高さを記録
  initialViewportHeight.value = window.visualViewport?.height || window.innerHeight;

  // イベントリスナーを追加
  document.addEventListener("touchstart", touchHandler, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, false);
  document.onselectstart = disableTextSelection;
  document.addEventListener("contextmenu", handleContextMenu, false);
  document.addEventListener("touchmove", disableScroll, { passive: false });

  // キーボード検出のイベントリスナー
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportChange);
  } else {
    window.addEventListener('resize', handleResize);
  }

  // フォーカスイベントリスナー
  document.addEventListener('focusin', handleFocusIn);
  document.addEventListener('focusout', handleFocusOut);
});

onUnmounted(() => {
  // イベントリスナーを削除
  document.removeEventListener("touchstart", touchHandler);
  document.removeEventListener("touchend", handleTouchEnd);
  document.onselectstart = null;
  document.removeEventListener("contextmenu", handleContextMenu);
  document.removeEventListener("touchmove", disableScroll);

  // キーボード検出のイベントリスナー削除
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
  } else {
    window.removeEventListener('resize', handleResize);
  }

  // フォーカスイベントリスナー削除
  document.removeEventListener('focusin', handleFocusIn);
  document.removeEventListener('focusout', handleFocusOut);
});
</script>

<template>
  <div class="background" :class="{ 
    'keyboard-open': isKeyboardOpen,
    'index-page': route.name === 'home',
    'no-scroll': route.name !== 'home' && !isKeyboardOpen
  }">
    <RouterView />
  </div>
</template>
