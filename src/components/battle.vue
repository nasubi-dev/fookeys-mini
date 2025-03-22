<script setup lang="ts">
import { onMounted, toRefs, ref } from "vue";
import { playerStore, gameStore } from "@/main";
import { e, s, i } from "@/log";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import decideImg from "@/assets/img/ui/decide.png";
import sumFieldImg from "@/assets/img/ui/info.png";
import eatingGif from "@/assets/gifs/eating.gif";
import { tap2, battlePhase, swipe } from "@/assets/sounds";

const useTap2 = useSound(tap2);
const useBattlePhase = useSound(battlePhase);
const useSwipe = useSound(swipe);
const { player, cardLock, phase, sumCards } = storeToRefs(playerStore);
const { field } = toRefs(player.value);
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
        <div v-if="phase === 'battle' && !cardLock" class="flex flex-col gap-5 p-20 justify-center items-center">
          <div class="relative">
            <img :src="sumFieldImg" class="w-[320px] min-w-[248px]" />
            <div class="overText">
              <div class="text-lg font-bold flex w-full justify-between px-6 items-center content-between">
                <p>{{ "🍖" + sumCards.hungry }}</p>
                <p>{{ "⚔" + sumCards.atk }}</p>
                <p>{{ "🛡" + sumCards.def }}</p>
                <p>{{ "💖" + sumCards.heal }}</p>
              </div>
            </div>
          </div>

          <button
            @click="
              turnEnd();
              useTap2.play();
            "
          >
            <img :src="decideImg" class="w-[150px]" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
