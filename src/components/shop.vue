<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import ShopOffer from "./shopOffer.vue";
import ShopUseGifts from "./shopUseGifts.vue";
import drawCardImg from "@/assets/img/ui/drawCard.png";
import useGiftImg from "@/assets/img/ui/useGift.png";
import shoppingGif from "@/assets/gifs/shopping.gif";
import back from "@/assets/img/ui/back.png";

import { useSound } from "@vueuse/sound";
import { tap2, shopping } from "@/assets/sounds";
const useTap2 = useSound(tap2);
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
const returnShop = () => {
  use.value = false;
  draw.value = false;
  useTap2.play();
};
</script>

<template>
  <div>
    <transition
      appear
      enter-from-class="translate-y-[-150%] opacity-0"
      leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300"
      enter-active-class="transition duration-300"
      mode="out-in"
    >
      <div v-if="shopAnimation">
        <img @load="loadShoppingGif()" :src="shoppingGif" />
      </div>
      <div v-else class="overlay">
        <ShopUseGifts v-show="use" @cancel="returnShop()" />
        <ShopOffer v-show="draw" />
        <div v-if="!draw && !use">
          <button
            @click="
              draw = true;
              useTap2.play();
            "
            style="width: 20vw"
          >
            <img :src="drawCardImg" />
          </button>
          <button
            @click="
              use = true;
              useTap2.play();
            "
            style="width: 20vw"
          >
            <img :src="useGiftImg" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
