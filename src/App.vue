<script setup lang="ts">
import { RouterView } from "vue-router";

//ピンチアウト禁止
const touchHandler = (event: any) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
};
document.addEventListener("touchstart", touchHandler, { passive: false });

//ダブルタップズーム禁止
let lastTouchEnd = 0;
document.addEventListener("touchend", function (event: any) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

//テキスト選択禁止
document.onselectstart = function () {
  return false;
};

//右クリック・長押しメニュー禁止（画像検索などを防ぐ）
document.addEventListener("contextmenu", function (event: any) {
  event.preventDefault();
}, false);

//スクロール禁止
function disableScroll(event: any) {
  event.preventDefault();
}
// イベントと関数を紐付け
document.addEventListener("touchmove", disableScroll, { passive: false });
</script>

<template>
  <div class="background">
    <RouterView />
  </div>
</template>
