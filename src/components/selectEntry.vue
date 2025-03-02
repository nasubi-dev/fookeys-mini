<script setup lang="ts">
import { storeToRefs } from "pinia";
import { playerStore } from "@/main";
import { useSound } from "@vueuse/sound";
import { tap1 } from "@/assets/sounds";
import { usePush } from "notivue";
import { startMatchmaking, startPasswordMatchmaking } from "@/server/useMatchMaking";
import { toRefs, watch } from "vue";

const p = defineProps<{
  changeLoadMenu: () => void;
}>();

const push = usePush();
const { id, log, player } = storeToRefs(playerStore);
const { password } = toRefs(player.value);

watch(log, () => {
  if (log.value === "") return;
  push.info({
    message: log.value,
    duration: 8000,
  });
  log.value = "";
});

const useTap1 = useSound(tap1);
async function startRandomMatch(): Promise<void> {
  if (!id.value) {
    push.warning("IDがありません｡一度トップページに戻ってください");
    return;
  }
  p.changeLoadMenu();
  await startMatchmaking();
}

async function startPasswordMatch(): Promise<void> {
  if (!id.value) {
    push.warning("IDがありません｡一度トップページに戻ってください");
    return;
  }
  p.changeLoadMenu();
  await startPasswordMatchmaking();
}
</script>

<template>
  <div class="flex flex-col gap-20 justify-center align-center">
    <div>
      <p class="text-center text-white">入力しなければランダムマッチング</p>
      <input class="border border-gray-400 m-auto rounded-lg p-2 w-72" type="text" placeholder="あいことばを入力" v-model="password" />
    </div>
    <button
      @click="
        useTap1.play();
        password === '' ? startRandomMatch() : startPasswordMatch();
      "
      class="btn-pop transform h-full w-full -my-3"
    >
      <div class="relative">
        <img src="@/assets/img/ui/entry.png" />
      </div>
    </button>
  </div>
</template>
