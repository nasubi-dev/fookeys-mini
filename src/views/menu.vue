<script setup lang="ts">
import { ref, toRefs, watch, onMounted, onUnmounted } from "vue";
import { usePush, Notivue, Notifications, filledIcons } from "notivue";
import { useSound } from "@vueuse/sound";
import { storeToRefs } from "pinia";
import { playerStore } from "@/main";
import { e, s, i } from "@/log";
import { tap1, tap2 } from "@/assets/sounds";
//components
import SelectCharacter from "@/components/menu/selectCharacter.vue";
import SelectGifts from "@/components/menu/selectGifts.vue";
import SelectEntry from "@/components/menu/selectEntry.vue";
import myLogImg from "@/components/common/myLog.vue";
import enemyLogImg from "@/components/common/enemyLog.vue";
import Tutorial from "@/components/common/Tutorial.vue";
//img
import characterBackground from "@/assets/img/ui/characterBackground.webp";
import menuBackground from "@/assets/img/ui/menuBackground.webp";
import back from "@/assets/img/ui/back.webp";
//bgm
import lobbyBGM from "@/assets/sounds/lobby.mp3";
import { registerPlayer, reNamePlayer } from "@/server/usePlayerData";

const customIcons = {
  success: myLogImg,
  error: enemyLogImg,
  info: filledIcons.info,
  close: filledIcons.close,
  promise: filledIcons.promise,
  warning: filledIcons.warning,
};
const push = usePush();

const { id, player, log } = storeToRefs(playerStore);
const { character, name } = toRefs(player.value);

watch(log, () => {
  if (log.value === "") return;
  push.info({
    message: log.value,
    duration: 8000,
  });
  log.value = "";
});

const useTap1 = useSound(tap1);
const useTap2 = useSound(tap2);

const UseLobbyBGM = useSound(lobbyBGM, {
  volume: 0.5,
  loop: true,
});

const selectGift = ref(false);
const selectCharacter = ref(false);
const selectEntry = ref(false);
const loadMenu = ref(true);
const showTutorial = ref(false);

function changeLoadMenu(): void {
  loadMenu.value = !loadMenu.value;
}

const openTutorial = () => {
  showTutorial.value = true;
};

const closeTutorial = () => {
  showTutorial.value = false;
};

onMounted(() => {
  UseLobbyBGM.stop();
  setTimeout(() => {
    UseLobbyBGM.play();
    loadMenu.value = false;
  }, 1000);
});

onUnmounted(() => {
  UseLobbyBGM.stop();
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
onMounted(() => {
  register();
});
</script>

<template>
  <div>
    <Notivue v-slot="item">
      <Notifications :item="item" :icons="customIcons" />
    </Notivue>
    <div v-if="loadMenu"
      class="fixed flex items-center justify-center w-full h-full z-30 m-auto p-10 text-8xl text-bold text-white gray">
      loading....
    </div>
    <div class="h-screen flex flex-col">
      <div class="z-10">
        <router-link v-if="!selectCharacter && !selectGift && !selectEntry" to="/">
          <button @click="useTap2.play()" class="p-4 absolute top-4 left-4 btn-pop">
            <img :src="back" class="w-32" />
          </button>
        </router-link>
        <button v-else class="p-4 absolute top-4 left-4 btn-pop" @click="
          selectCharacter = false;
        selectGift = false;
        selectEntry = false;
        useTap2.play();
        ">
          <img :src="back" class="w-32" />
        </button>
      </div>

      <div class="flex flex-1">
        <div class="relative w-1/2 p-8 flex flex-col justify-center items-center text-center">
          <img :src="characterBackground" />
          <div class="overText items-center">
            <img :src="`/img/characters/${character}/normal.webp`" />
          </div>
        </div>

        <div class="w-1/2 px-3 flex flex-col justify-center text-center items-center">
          <div class="relative">
            <img :src="menuBackground" class="h-screen" />
            <div v-if="!selectCharacter && !selectGift && !selectEntry" class="overText w-full">
              <button @click="
                selectEntry = !selectEntry;
              useTap1.play();
              " class="btn-pop my-4">
                <img src="@/assets/img/ui/entry.webp" />
              </button>
              <button @click="
                selectCharacter = !selectCharacter;
              useTap1.play();
              " class="btn-pop my-4">
                <img src="@/assets/img/ui/changeCharacter.webp" />
              </button>
              <button @click="
                selectGift = !selectGift;
              useTap1.play();
              " class="btn-pop my-4">
                <img src="@/assets/img/ui/giftList.webp" />
              </button>
              <!-- チュートリアルボタン -->
              <button @click="openTutorial(); useTap1.play();"
                class="btn-pop my-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg px-6 py-3">
                チュートリアル
              </button>
            </div>
            <div v-else-if="selectEntry" class="overText w-full">
              <SelectEntry :changeLoadMenu="changeLoadMenu" />
            </div>
            <div v-else-if="selectCharacter" class="overText w-full">
              <SelectCharacter />
            </div>
            <div v-else-if="selectGift" class="overText w-full">
              <SelectGifts />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- チュートリアルModal -->
    <Tutorial :is-open="showTutorial" @close="closeTutorial" />
  </div>
</template>
