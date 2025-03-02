<script setup lang="ts">
import { toRefs } from "vue";
import { storeToRefs } from "pinia";
import { playerStore } from "@/main";
import { useSound } from "@vueuse/sound";
import { tap1 } from "@/assets/sounds";
import allGifts from "@/assets/allGifts";
import giftSelectBackground from "@/assets/img/ui/giftSelectBackground.png";

const { player } = storeToRefs(playerStore);
const { gifts } = toRefs(player.value);

const useTap1 = useSound(tap1);

function selectGift(gift: number): void {
  //GiftがGiftsに含まれている数値だった場合､Return
  if (gifts.value.includes(gift)) return;
  if (gifts.value.length > 3) return;
  gifts.value.unshift(gift);
  gifts.value = gifts.value.slice(0, 3);
  console.log("gifts: " + allGifts[gifts.value[0]].name, allGifts[gifts.value[1]].name, allGifts[gifts.value[2]].name);
}
</script>

<template>
  <div class="flex flex-wrap">
    <div v-for="(gift, index) in allGifts" :key="gift.name">
      <button
        @click="
          selectGift(gift.id);
          useTap1.play();
        "
        class="btn-pop transform h-full w-full -my-3"
        :class="index % 2 ? `-translate-x-[30%]` : `translate-x-[30%]`"
      >
        <div class="flex items-center">
          <img :src="`./img/gifts/${gift.id}.png`" class="w-20" />
          <p class="fixed text-border text-xl font-bold left-0 -bottom-2">{{ gift.requireContribution }}</p>
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
