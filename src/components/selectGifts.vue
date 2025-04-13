<script setup lang="ts">
import { toRefs } from "vue";
import { storeToRefs } from "pinia";
import { playerStore } from "@/main";
import { useSound } from "@vueuse/sound";
import { tap1 } from "@/assets/sounds";
import allGifts from "@/assets/allGifts";
import giftSelectBackground from "@/assets/img/ui/giftSelectBackground.png";

const { player } = storeToRefs(playerStore);

const useTap1 = useSound(tap1);

</script>

<template>
  <div class="flex flex-wrap">
    <div v-for="(gift, index) in allGifts" :key="gift.name">
      <button @click="useTap1.play();" class="btn-pop transform h-full w-full -my-3"
        :class="index % 2 ? `-translate-x-[30%]` : `translate-x-[30%]`">
        <div class="flex items-center">
          <img :src="`./img/gifts/${gift.id}.png`" class="w-20" />
          <div class="relative w-full">
            <img :src="giftSelectBackground" style="width: 25vw" />
            <div class="overText flex flex-col justify-start text-left align-text-bottom ml-3">
              <p class="w-full text-lg text-gray-800 break-words font-bold ml-5">{{ gift.name }}</p>
              <p class="w-full text-xs text-gray-900 break-words">{{ gift.description }}</p>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
