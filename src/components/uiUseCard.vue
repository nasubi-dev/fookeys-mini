<script setup lang="ts">
import { watch, ref, onMounted } from "vue";
import { e, s, i } from "@/log";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import type { PlayerData, PlayerSign } from "@/types";
import uiCardBehind from "./uiCardBehind.vue";
import infoImg from "@/assets/img/ui/info.png";
import battleImg from "@/assets/img/ui/battle.png";
import donateImg from "@/assets/img/ui/donate.png";

const { battleResult } = storeToRefs(playerStore);

const p = defineProps<{
  player: PlayerData;
  firstAtkPlayer: PlayerSign | undefined;
  components: string;
  which: "primary" | "second";
}>();

const characterName = ref();
onMounted(() => {
  characterName.value = p.player.character;
});

const isShowHeal = ref(true);
const isShowSup = ref(true);
const isShowDef = ref(true);
const isShowAtk = ref(true);
const isShowTech = ref(true);
watch(battleResult, (newVal) => {
  if (!p.components.includes(p.which)) return;
  if (newVal[0] === "donate") {
    isShowHeal.value = false;
    isShowSup.value = false;
    isShowDef.value = false;
    isShowAtk.value = false;
    isShowTech.value = false;
  }
  if (newVal[0] === "heal") isShowHeal.value = false;
  if (newVal[0] === "sup") isShowSup.value = false;
  if (newVal[0] === "def") isShowDef.value = false;
  if (newVal[0] === "atk") isShowAtk.value = false;
  if (newVal[0] === "tech") isShowTech.value = false;
});
</script>

<template>
  <Transition
    appear
    enter-from-class="translate-y-[-150%] opacity-0"
    leave-to-class="translate-x-[-150%] opacity-0"
    leave-active-class="transition duration-300"
    enter-active-class="transition duration-300"
  >
    <div style="width: 20vw">
      <div class="relative flex justify-start">
        <img :src="infoImg" />
        <div class="overText">
          <div class="flex justify-start items-center font-bold text-[max(2vw,1rem)]">
            <img v-if="characterName" :src="`/img/characters/${characterName}/normal.png`" class="w-1/3 bottom-5 bg-clip-border" />
            <p v-if="!p.player.donate">{{ "🍖" + p.player.sumFields.hungry }}</p>
            <p v-if="p.player.sumFields.priority && !p.player.donate">{{ "🦶" + p.player.sumFields.priority }}</p>
            <div class="ml-auto mr-5 w-[max(2vw,25px)]">
              <img v-if="p.player.donate" :src="donateImg" />
              <img v-else :src="battleImg" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap">
        <uiCardBehind v-show="isShowHeal" :cards="p.player.field" :attribute="'heal'" />
        <uiCardBehind v-show="isShowSup" :cards="p.player.field" :attribute="'sup'" />
        <uiCardBehind v-show="isShowDef" :cards="p.player.field" :attribute="'def'" />
        <uiCardBehind v-show="isShowAtk" :cards="p.player.field" :attribute="'atk'" />
        <uiCardBehind v-show="isShowTech" :cards="p.player.field" :attribute="'tech'" />
      </div>
    </div>
  </Transition>
</template>
