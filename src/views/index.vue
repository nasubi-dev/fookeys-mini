<script setup lang="ts">
import { ref, toRefs, watch, onMounted } from "vue";
import { usePush, Notivue, Notifications, filledIcons } from "notivue";
import { useSound } from "@vueuse/sound";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { registerPlayer, reNamePlayer } from "@/server/usePlayerData";
import { tap1 } from "@/assets/sounds";
import myLogImg from "@/components/myLog.vue";
import enemyLogImg from "@/components/enemyLog.vue";
const customIcons = {
  success: myLogImg,
  error: enemyLogImg,
  info: filledIcons.info,
  close: filledIcons.close,
  promise: filledIcons.promise,
  warning: filledIcons.warning,
};
const push = usePush();

//storeの参照
const { id, player, log } = storeToRefs(playerStore);
const { name } = toRefs(player.value);

const useTap1 = useSound(tap1);
watch(log, () => {
  if (log.value === "") return;
  push.info({
    message: log.value,
    duration: 18000,
  });
  log.value = "";
});

const newName = ref("");
onMounted(() => {
  newName.value = name.value;
});
//アプリが起動したらユーザーIDを取得する ユーザー名が空の場合はNo name
async function register() {
  newName.value === "" ? (name.value = "No name") : (name.value = newName.value);
  await reNamePlayer(name.value);
  id.value == "" ? await registerPlayer() : (log.value = "idは既に登録されています");
}
</script>

<template>
  <div>
    <Notivue v-slot="item">
      <Notifications :item="item" :icons="customIcons" />
    </Notivue>
    <div class="flex flex-col items-center justify-center h-screen">
      <img src="@/assets/img/ui/fookeys.png" class="w-[min(40vw,700px)] mb-auto mt-32" />
      <div class="absolute top-2/3 flex flex-col">
        <form class="flex flex-col items-center">
          <a href="https://minimi-323.hatenablog.com/entry/2023/05/26/222715" target="_blank" class="text-yellow-300"> 説明書リンク </a>
          <input class="border border-gray-400 rounded-lg p-2 w-72" type="text" placeholder="名前を入力" v-model="newName" />
          <router-link
            to="/menu"
            @click="
              register();
              useTap1.play();
            "
            type="button"
            class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg px-4 py-2 btn-pop"
          >
            <button>Start</button>
          </router-link>
        </form>
      </div>
    </div>
  </div>
</template>
