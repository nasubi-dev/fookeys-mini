<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import ShopOffer from "@/components/flexible/shopOffer.vue";
import shoppingGif from "@/assets/gifs/shopping.gif";

import { useSound } from "@vueuse/sound";
import { tap2, shopping } from "@/assets/sounds";
const useShopping = useSound(shopping);

const { cardLock } = storeToRefs(playerStore);

const use = ref(false);
const draw = ref(false);
//WatchでCardLockを監視して､trueになったらuseとdrawをfalseにする
watch(cardLock, (newVal) => {
  if (newVal) {
    use.value = false;
    draw.value = false;
  }
});

const shopAnimation = ref(true);
const loadShoppingGif = () => {
  useShopping.play();
  setTimeout(() => {
    shopAnimation.value = false;
  }, 1000);
};
</script>

<template>
  <div>
    <transition appear enter-from-class="translate-y-[-150%] opacity-0" leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300" enter-active-class="transition duration-300" mode="out-in">
      <div v-if="shopAnimation">
        <img @load="loadShoppingGif()" :src="shoppingGif" />
      </div>
      <div v-else class="overlay">
        <ShopOffer />
      </div>
    </transition>
  </div>
</template>
