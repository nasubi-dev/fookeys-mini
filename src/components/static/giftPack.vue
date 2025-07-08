<script setup lang="ts">
import giftPackEnemyBackground from "@/assets/img/ui/giftPackEnemyBackground.webp";
import giftPackMyBackground from "@/assets/img/ui/giftPackMyBackground.webp";
import giftPackIcon from "@/assets/img/ui/giftPackIcon.webp";
import characterBackground from "@/assets/img/ui/characterBackground.webp";
import VDuringPress from "@/components/common/VDuringPress.vue";

import { ref, toRefs, watch, onMounted, computed } from "vue";
import { playerStore, gameStore, enemyPlayerStore } from "@/main";
import { wait, XOR } from "@/server/utils";
import { storeToRefs } from "pinia";

const p = defineProps<{ status: "my" | "enemy" }>();

const { player } = storeToRefs(playerStore);
const { giftPackGauge: myGiftPackGauge, giftPackCounter: myGiftPackCounter } = toRefs(player.value);

const { enemyPlayer } = storeToRefs(enemyPlayerStore);

const isMyStatus = computed(() => p.status === "my");
const currentGiftPackGauge = computed(() => (isMyStatus.value ? myGiftPackGauge.value : enemyPlayer.value.giftPackGauge));
const currentGiftPackCounter = computed(() => (isMyStatus.value ? myGiftPackCounter.value : enemyPlayer.value.giftPackCounter));
const currentBackground = computed(() => (isMyStatus.value ? giftPackMyBackground : giftPackEnemyBackground));
const currentGaugeStyle = computed(() =>
  isMyStatus.value ? { height: `${100 - currentGiftPackGauge.value}%` } : { width: `${100 - currentGiftPackGauge.value}%` }
);

const dropDown = ref(false);
const toggleDropDown = (value: boolean): void => {
  dropDown.value = value;
};
</script>

<template>
  <div>
    <div class="relative">
      <div v-if="dropDown"
        class="z-20 fixed pr-10 text-gray-900 text-left w-50 transform -translate-x-72 -translate-y-32">
        <div class="w-[max(20vw,270px)]">
          <img :src="characterBackground" class="absolute transform -scale-x-100" />
          <div class="z-30 pb-8 pt-8 px-12 relative">
            {{ currentGiftPackGauge }}
            {{ currentGiftPackCounter }}
          </div>
        </div>
      </div>

      <VDuringPress :onKeyDown="() => toggleDropDown(true)" :onKeyUp="() => toggleDropDown(false)" :delay="250">
        <div>
          <img class="absolute" :class="isMyStatus ? `top-0` : `-top-16`" :src="currentBackground" />

          <div class="absolute"
            :class="isMyStatus ? `gauge h-[min(23vw,130px)] right-3 top-2` : `gauge-enemy w-[100px] -top-14`">
            <div :style="currentGaugeStyle" :class="isMyStatus ? `bar` : `bar-enemy`">
              <div class="font-bold text-center"
                :class="isMyStatus ? `text-xl text-center` : `text-md align-middle absolute right-2 -top-1`" style="
                  text-shadow:
                    -1px -1px 0 #fff,
                    1px -1px 0 #fff,
                    -1px 1px 0 #fff,
                    1px 1px 0 #fff;
                ">
                {{ currentGiftPackGauge }}
              </div>
            </div>
          </div>
          <img :src="giftPackIcon" class="absolute" :class="isMyStatus ? `w-[70%] -bottom-24` : `w-[40%] -top-12`" />
        </div>
      </VDuringPress>
    </div>
  </div>
</template>
