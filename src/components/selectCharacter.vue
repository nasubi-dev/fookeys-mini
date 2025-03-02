<script setup lang="ts">
import { toRefs } from "vue";
import type { Character } from "@/types";
import { storeToRefs } from "pinia";
import { playerStore } from "@/main";
import { useSound } from "@vueuse/sound";
import { tap1 } from "@/assets/sounds";
import allCharacters from "@/assets/allCharacters";
import characterSelectBackground from "@/assets/img/ui/characterSelectBackground.png";

const { player } = storeToRefs(playerStore);
const { character } = toRefs(player.value);

const useTap1 = useSound(tap1);
</script>

<template>
  <div class="flex flex-col">
    <div v-for="chara in allCharacters" :key="chara.name">
      <button
        @click="
          character = chara.name;
          useTap1.play();
        "
        class="btn-pop transform h-full w-full -my-3"
      >
        <div class="relative">
          <img :src="characterSelectBackground" style="width: 25vw" />
          <img :src="`/img/characters/${chara.name}/normal.png`" class="overText w-full" />
        </div>
      </button>
    </div>
  </div>
</template>
