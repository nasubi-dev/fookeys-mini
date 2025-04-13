<script setup lang="ts">
import giftPackEnemyBackground from "@/assets/img/ui/giftPackEnemyBackground.png"
import giftPackMyBackground from "@/assets/img/ui/giftPackMyBackground.png"
import giftPackIcon from "@/assets/img/ui/giftPackIcon.png"

import { ref, toRefs, watch, onMounted } from "vue";
import { playerStore, gameStore, enemyPlayerStore } from "@/main";
import { wait, XOR } from "@/server/utils";
import { storeToRefs } from "pinia";
import { getEnemyPlayer } from "@/server/usePlayerData";

const p = defineProps<{ status: "my" | "enemy" }>();

const { player } = storeToRefs(playerStore);
const { giftPackGauge } = toRefs(player.value);

const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { giftPackGauge: enemyGiftPackGauge } = toRefs(enemyPlayer.value);

const gauge = ref(100 - ((p.status === `my` ? giftPackGauge.value : enemyGiftPackGauge.value) / 100) * 100);

</script>

<template>
  <div class="relative">
    <img class="absolute" :class="status === `my` ? `null` : `-top-8`"
      :src="status === `my` ? giftPackMyBackground : giftPackEnemyBackground" />

    <div class="absolute"
      :class="status === `my` ? `gauge h-[min(23vw,130px)] right-3 top-1` : `gauge-enemy w-[100px] -top-7`">
      <div :style="status === `my` ? { height: gauge + '%' } : { width: gauge + '%' }"
        :class="status === `my` ? `bar` : `bar-enemy`">
      </div>
    </div>

    <img :src="giftPackIcon" class="absolute" :class="status === `my` ? `w-[70%] bottom-1` : `w-[40%] -top-4`" />
  </div>
</template>
