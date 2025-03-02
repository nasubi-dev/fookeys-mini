<script setup lang="ts">
import { ref, watch } from "vue";
import { useSound } from "@vueuse/sound";
import { popUp, success } from "@/assets/sounds";
import type { Mission } from "@/types";
import VDuringPress from "./VDuringPress.vue";
import missionImg from "@/assets/img/ui/mission.png";
import bg from "@/assets/img/ui/42x.png";
import { wait } from "@/server/utils";


const p = defineProps<{ mission: Mission }>();

const usePopUp = useSound(popUp);
const useSuccess = useSound(success, { volume: 0.3 });

watch(
  () => p.mission.achieved,
  (newVal) => {
    if (newVal) useSuccess.play();
  }
);

const dropDown = ref(false);
const onLongPressCallbackHook = (): void => {
  console.log("longPress");
  dropDown.value = true;
  usePopUp.play();
};
const onKeyUpCallbackHook = (): void => {
  dropDown.value = false;
};

const missionClass = ref("");
watch(
  () => p.mission.nowAchievement,
  (newVal, oldVal) => {
    //増えたらshake
    if (newVal > oldVal) {
      missionClass.value = "animate-jump";
      wait(1000).then(() => {
        missionClass.value = "animate-stop";
      });
    }
  },
  { deep: true }
);
</script>

<template>
  <div :class="missionClass" style="user-select: none">
    <div v-if="dropDown" class="fixed w-[250px] z-10 text-left transform -translate-y-16 -translate-x-20">
      <div class="absolute w-[250px]">
        <img :src="bg" class="z-20 absolute w-[250px]" />
        <div class="z-20 p-4 w-[250px] text-ellipsis  whitespace-pre-wrap absolute">
          {{ mission.description }}
        </div>
      </div>
    </div>

    <div class="relative">
      <VDuringPress :onKeyDown="onLongPressCallbackHook" :onKeyUp="onKeyUpCallbackHook" :delay="250">
        <img :src="missionImg" class="w-[250px]" />
        <div class="overText">
          <span class="flex flex-row-reverse w-full pl-5 pr-4 text-sm text-gray-900">
            <span class="ml-auto font-bold">{{ "🪙" + mission.reward }}</span>
            <span class="ml-1 font-bold">{{ mission.name }}</span>
          </span>
          <div class="gauge w-[210px] ml-1">
            <span v-if="mission.achieved" class="text-sm font-bold text-gray-900">✔</span>
            <span v-else class="text-sm font-bold text-white fixed">{{ mission.nowAchievement + "/" +
              mission.goalAchievement }}</span>
            <div class="bar" :style="{ width: 100 - (mission.nowAchievement / mission.goalAchievement) * 100 + '%' }">
            </div>
          </div>
        </div>
      </VDuringPress>
    </div>
  </div>
</template>
