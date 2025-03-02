<script setup lang="ts">
import { RouterView } from "vue-router";

//ピンチアウト禁止
const touchHandler = (event: any) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
};
document.addEventListener("touchstart", touchHandler, { passive: false });
//テキスト選択禁止
document.onselectstart = function () {
  return false;
};
//テキスト選択禁止
document.onselectstart = function () {
  return false;
};
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
