<script setup lang="ts">
import { toRefs, ref } from "vue";
import _sortBy from "lodash/sortBy";
import { e, s, i } from "@/log";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { wait } from "@/server/utils";
import { watchShopEnd } from "@/server/useShop";
import type { Card } from "@/types";
import UiCard from "./uiCard.vue";
import decide from "@/assets/img/ui/decide.png";

import { useSound } from "@vueuse/sound";
import { tap1, tap2 } from "@/assets/sounds";
const useTap1 = useSound(tap1);
const useTap2 = useSound(tap2);

const { offer, player, phase, log } = storeToRefs(playerStore);
const { hand, rottenHand } = toRefs(player.value);

const isOfferSelected = ref([false, false, false]);
const pushed = ref(false);
//カードを選択する
const offerSelect = (index: number) => {
  if (hand.value.length + rottenHand.value.length + isOfferSelected.value.filter((bool) => bool).length >= 9) {
    if (!isOfferSelected.value[index]) {
      log.value = "手札がいっぱいでこれ以上買い物できない！";
      return;
    }
  }
  isOfferSelected.value[index] = !isOfferSelected.value[index];
};
//選択を確定させたらHandにtrueのカードを追加して､offerを空にする
const offer2Hand = async () => {
  const offerHand: Card[] = offer.value.filter((card, index) => isOfferSelected.value[index]);
  console.log(
    i,
    "offer2Hand: ",
    offerHand.map((card) => card.name)
  );
  hand.value.push(...offerHand);
  wait(100);
  hand.value = _sortBy(hand.value, ["id", "waste"]);

  //offerを空にする
  offer.value = [];
  isOfferSelected.value = [false, false, false];
  pushed.value = false;
  await watchShopEnd();
};
</script>

<template>
  <div>
    <transition-group
      enter-from-class="translate-y-[-150%] opacity-0"
      leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300"
      enter-active-class="transition duration-300"
    >
      <div v-if="phase === 'shop' && !pushed" class="flex justify-center">
        <button
          @click="
            offer2Hand();
            useTap2.play(), (pushed = !pushed);
          "
        >
          <img :src="decide" style="width: 20vw" />
        </button>
        <div class="flex justify-start w-full">
          <div v-for="(card, index) in offer" :key="card.id">
            <button
              @click="
                offerSelect(index);
                useTap1.play();
              "
              class="card-pop"
              :class="isOfferSelected[index] ? 'transform -translate-y-5' : null"
            >
              <UiCard :card="card" size="big" style="width: 15vw" />
            </button>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>
