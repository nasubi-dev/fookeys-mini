<script setup lang="ts">
import { ref, toRefs, watch, onMounted } from "vue";
import { usePush, Notivue, Notifications, filledIcons } from "notivue";
import { useSound } from "@vueuse/sound";
import { playerStore } from "@/main";
import { storeToRefs } from "pinia";
import { registerPlayer, reNamePlayer } from "@/server/usePlayerData";
import { tap1 } from "@/assets/sounds";
import myLogImg from "@/components/common/myLog.vue";
import enemyLogImg from "@/components/common/enemyLog.vue";
import Tutorial from "@/components/common/Tutorial.vue";

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
const showTutorial = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  newName.value = name.value;

  // 初回訪問時にチュートリアルを自動表示
  const tutorialCompleted = localStorage.getItem("tutorial_completed");
  if (!tutorialCompleted) {
    showTutorial.value = true;
  }
});

//アプリが起動したらユーザーIDを取得する ユーザー名が空の場合はNo name
async function register() {
  newName.value === "" ? (name.value = "No name") : (name.value = newName.value);
  await reNamePlayer(name.value);
  id.value == "" ? await registerPlayer() : (log.value = "idは既に登録されています");

  // 入力フィールドのフォーカスを外してキーボードを非表示にする
  if (nameInputRef.value) {
    nameInputRef.value.blur();
  }
}

// 入力フィールドのEnterキー押下時の処理
const handleEnterKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    register();
    useTap1.play();
  }
}

const openTutorial = () => {
  showTutorial.value = true;
};

const closeTutorial = () => {
  showTutorial.value = false;
};

// 画面タップ時にフォーカスを外す処理
const handleScreenTap = (event: Event) => {
  const target = event.target as HTMLElement;
  // 入力フィールドやボタン以外をタップした場合のみフォーカスを外す
  if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON' && !target.closest('button')) {
    if (nameInputRef.value) {
      nameInputRef.value.blur();
    }
  }
};
</script>

<template>
  <div @click="handleScreenTap" class="h-screen w-screen bg-black">
    <Notivue v-slot="item">
      <Notifications :item="item" :icons="customIcons" />
    </Notivue>
    <div class="flex flex-col items-center justify-center h-screen">
      <img src="@/assets/img/ui/fookeys-mini.webp" class="w-[min(40vw,700px)] mb-auto mt-32" />
      <div class="absolute top-2/3 flex flex-col">
        <div class="flex flex-col items-center">
          <button @click="
            openTutorial();
          useTap1.play();
          " type="button" class="mb-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg px-4 py-2 btn-pop">
            チュートリアル
          </button>
          <input ref="nameInputRef" class="border border-gray-400 rounded-lg p-2 w-72" type="text" placeholder="名前を入力"
            v-model="newName" @keydown.enter="handleEnterKey" />
          <router-link to="/menu" @click="
            register();
          useTap1.play();
          " type="button"
            class="mt-4  bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg px-4 py-2 btn-pop">
            <button>Start</button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- チュートリアルModal -->
    <Tutorial :is-open="showTutorial" @close="closeTutorial" />
  </div>
</template>
