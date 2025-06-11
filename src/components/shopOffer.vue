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
import { BATTLE_CONSTANTS } from "@/consts";

import { useSound } from "@vueuse/sound";
import { tap1, tap2 } from "@/assets/sounds";
const useTap1 = useSound(tap1);
const useTap2 = useSound(tap2);

const { offer, player, phase, log } = storeToRefs(playerStore);
const { hand, rottenHand } = toRefs(player.value);

const isOfferSelected = ref(Array(BATTLE_CONSTANTS.SHOP_OFFER_COUNT).fill(false));
const pushed = ref(false);
//カードを選択する
const offerSelect = (index: number) => {
  const selectedCount = isOfferSelected.value.reduce((count, selected) => count + (selected ? 1 : 0), 0);
  if (hand.value.length + rottenHand.value.length + selectedCount >= BATTLE_CONSTANTS.MAX_HAND_SIZE) {
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
  wait(BATTLE_CONSTANTS.WAIT_TIME.VERY_SHORT);
  hand.value = _sortBy(hand.value, ["id", "waste"]);

  //offerを空にする
  offer.value = [];
  isOfferSelected.value = Array(BATTLE_CONSTANTS.SHOP_OFFER_COUNT).fill(false);
  pushed.value = false;
  await watchShopEnd();
};
</script>

<template>
  <div>
    <transition-group enter-from-class="translate-y-[-150%] opacity-0" leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300" enter-active-class="transition duration-300">
      <div v-if="phase === 'shop' && !pushed" class="flex justify-center">
        <div class="flex flex-col justify-center align-middle p-2">
          <div class="flex flex-row max-w-[400px] justify-center">
            <div v-for="(card, index) in offer" :key="card.id">
              <button @click="
                offerSelect(index);
              useTap1.play();
              " class="card-pop" :class="isOfferSelected[index] ? 'transform -translate-y-5' : null">
                <UiCard :card="card" size="big" :index="index" />
              </button>
            </div>
          </div>
          <button @click="
            offer2Hand();
          useTap2.play(), (pushed = !pushed);
          " class="w-[150px] self-center">
            <img :src="decide" />
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>
