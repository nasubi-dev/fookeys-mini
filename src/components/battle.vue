<script setup lang="ts">
import { onMounted, toRefs, ref } from "vue";
import { playerStore, gameStore } from "@/main";
import { e, s, i } from "@/log";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import decideImg from "@/assets/img/ui/decide.png";
import battleImg from "@/assets/img/ui/battle.png";
import donateImg from "@/assets/img/ui/donate.png";
import sumFieldImg from "@/assets/img/ui/info.png";
import eatingGif from "@/assets/gifs/eating.gif";
import { tap2, battlePhase, swipe } from "@/assets/sounds";

const useTap2 = useSound(tap2);
const useBattlePhase = useSound(battlePhase);
const useSwipe = useSound(swipe);
const { player, cardLock, phase, sumCards } = storeToRefs(playerStore);
const { donate, field } = toRefs(player.value);
const { game } = storeToRefs(gameStore);

//ターンを終了時
const turnEnd = () => {
  if (cardLock.value) return;
  console.log(i, "turnEnd");
  //cardLockをtrueにする
  cardLock.value = true;
  //!手札がFirestoreに保存するためにhand.vueから移動する
};

const battleAnimation = ref(false);
onMounted(() => {
  if (game.value.turn === 1) return;
  battleAnimation.value = true;
  donate.value = false;
});
const loadBattleGif = () => {
  useBattlePhase.play();
  setTimeout(() => {
    battleAnimation.value = false;
  }, 1500);
};
</script>

<template>
  <div>
    <transition
      appear
      enter-from-class="translate-y-[-150%] opacity-0"
      leave-to-class="translate-y-[150%] opacity-0"
      leave-active-class="transition duration-300"
      enter-active-class="transition duration-300"
    >
      <div v-if="battleAnimation" class="overlay">
        <img @load="loadBattleGif()" :src="eatingGif" />
      </div>
      <div v-else>
        <div v-if="phase === 'battle' && !cardLock" class="flex">
          <button
            @click="
              turnEnd();
              useTap2.play();
            "
          >
            <img :src="decideImg" class="w-[max(15dvw,200px)]" />
          </button>

          <div class="relative w-[max(30dvw,200px)]">
            <img :src="sumFieldImg" />
            <div class="overText text-lg font-bold">
              <div v-if="!donate" class="flex text-[max(2vw,1rem)] items-center mb-3 animate-rotate-x animate-duration-300">
                <p>{{ "🍖" + sumCards.hungry }}</p>
                <p>{{ "⚔" + sumCards.atk }}</p>
                <p>{{ "🛡" + sumCards.def }}</p>
                <p>{{ "⚡️" + sumCards.tech }}</p>
                <p>{{ "🦶 " + sumCards.priority }}</p>
                <p>{{ "💖" + sumCards.heal }}</p>
              </div>
              <div v-else class="flex text-[max(2vw,1rem)] items-center mb-3 animate-rotate-x animate-duration-300">
                <p>{{ "🪙" + field.length * 5 }}</p>
              </div>
            </div>
          </div>
          <button
            @click="
              donate = !donate;
              useSwipe.play();
            "
            class="card-pop"
          >
            <div class="relative">
              <div class="p-8 bg-white border-gray-700 rounded-full border-2" />
              <div class="overText">
                <img v-if="donate" :src="donateImg" />
                <img v-else :src="battleImg" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
