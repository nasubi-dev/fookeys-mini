<script setup lang="ts">
import { toRefs, ref, watch } from "vue";
import { e, s, i } from "@/log";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { useSound } from "@vueuse/sound";
import { tap1 } from "@/assets/sounds";
import type { PlayerData } from "@/types";
import { db } from "../../server/firebase";
import { collection } from "firebase/firestore";
import { converter } from "@/server/converter";
import { watchTurnEnd } from "@/server/useShop";
import UiCard from "@/components/common/card.vue";
import allCards from "@/assets/allCards";
const useTap1 = useSound(tap1);

const playersRef = collection(db, "players").withConverter(converter<PlayerData>());

const { pushHand, popHand } = playerStore;
const { player, cardLock, log, sumCards } = storeToRefs(playerStore);
const { hand, rottenHand, field, idEnemy, status, isSaleZeroHungry } = toRefs(player.value);

const recoverRottenHand = ref(false);
watch(
  () => rottenHand.value.length,
  (newVal, oldVal) => {
    if (newVal > oldVal) {
      recoverRottenHand.value = true;
      setTimeout(() => {
        recoverRottenHand.value = false;
      }, 1000);
    }
  }
);
const isHandSelected = ref([false, false, false, false, false]);
//WatchでCardLockを監視して､trueになったら使用するカードを手札から削除する
watch(cardLock, async (newVal) => {
  if (newVal) {
    const deleteIndex = isHandSelected.value.reduce((acc: number[], bool, index) => {
      if (bool) acc.unshift(index);
      return acc;
    }, []);
    deleteIndex.forEach((index) => {
      hand.value.splice(index, 1);
    });
    console.log(
      i,
      "deleteHand: ",
      "hand: ",
      hand.value.map((card) => card.name)
    );
    isHandSelected.value = [false, false, false, false, false];
    await watchTurnEnd();
  }
});
//HandからFieldへ
const pushCard = async (index: number) => {
  if (cardLock.value) return;
  if (
    status.value.hungry +
      sumCards.value.hungry -
      (isSaleZeroHungry.value ? field.value.reduce((acc, card) => (card.isSale ? acc + card.hungry : acc), 0) : 0) +
      (isSaleZeroHungry.value ? 0 : allCards[hand.value[index].id].hungry) >
    status.value.maxHungry
  ) {
    log.value = "お腹がいっぱいでこれ以上食べれない！";
    return;
  }

  if (isHandSelected.value[index]) throw new Error("failed to pushCard");
  isHandSelected.value[index] = !isHandSelected.value[index];
  pushHand(index);
};
//FieldからHandへ
const popCard = (index: number, id: number) => {
  if (cardLock.value) return;
  if (!isHandSelected.value[index]) throw new Error("failed to popCard");
  isHandSelected.value[index] = !isHandSelected.value[index];
  popHand(index, id);
};
</script>

<template>
  <div class="flex justify-start overflow-x-visible">
    <transition-group
      enter-from-class="translate-y-[-150%] opacity-0"
      leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300"
      enter-active-class="transition duration-300"
    >
      <div class="flex justify-start">
        <div v-for="(card, index) in rottenHand" :key="card.id" :class="recoverRottenHand ? `animate-jump` : null">
          <div>
            <button @click="log = '腐ったカードは使えない'" class="cardSize relative">
              <UiCard :card="card" size="normal" :index="index" />
            </button>
          </div>
        </div>
        <img v-if="hand.length === 0" src="../../assets/img/alpha.png" class="cardSize" />
        <div v-for="(card, index) in hand" :key="card.id">
          <button
            @click="
              !isHandSelected[index] ? pushCard(index) : popCard(index, card.id);
              cardLock ? null : useTap1.play();
            "
            :class="isHandSelected[index] ? 'transform -translate-y-4' : null"
            class="cardSize relative"
          >
            <UiCard :card="card" size="normal" :state="isHandSelected[index]" :index="index" />
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>
