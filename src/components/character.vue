<script setup lang="ts">
import { ref, toRefs, watch, onMounted } from "vue";
import { playerStore, gameStore, enemyPlayerStore } from "@/main";
import { wait, XOR } from "@/server/utils";
import { storeToRefs } from "pinia";
import { getEnemyPlayer } from "@/server/usePlayerData";

const p = defineProps<{ status: "my" | "enemy" }>();
const emit = defineEmits<{
  (event: "isWiggle", reactionImg: string): void;
}>();

const { components, battleResult, sign, player } = storeToRefs(playerStore);
const { character } = toRefs(player.value);
const { enemyPlayer } = storeToRefs(enemyPlayerStore);
const { game } = storeToRefs(gameStore);
const { firstAtkPlayer } = toRefs(game.value);

const characterName = ref();
onMounted(async () => {
  await getEnemyPlayer();
  if (p.status === "my") characterName.value = character.value;
  if (p.status === "enemy") characterName.value = enemyPlayer.value.character;
});

const retainedDef = ref<number>(0);
const reactionImg = ref<string>("normal");
watch(battleResult, (newVal) => {
  if (typeof newVal[1] !== "number") return;
  const isPrimaryAtk = components.value === "primaryAtk";
  const isChangingValue = !XOR(firstAtkPlayer.value === sign.value, p.status === "my"); // X-NOR
  const attackOrder = !XOR(isPrimaryAtk, isChangingValue); // X-NOR

  if (attackOrder) {
    if (newVal[0] === "def") {
      reactionImg.value = "def";
      retainedDef.value = newVal[1];
    } else if (newVal[0] === "atk" || newVal[0] === "tech") {
      reactionImg.value = "atk";
    }
  } else {
    if (newVal[0] === "atk") {
      reactionImg.value = "damage";
      retainedDef.value -= isPrimaryAtk ? 0 : newVal[1];
      if (retainedDef.value < 0) retainedDef.value = 0;
    } else if (newVal[0] === "tech") {
      reactionImg.value = "damage";
    }
  }

  //初期化
  if (newVal[0] === "none") {
    if (!isPrimaryAtk) retainedDef.value = 0;
    reactionImg.value = "normal";
  }
  emit("isWiggle", reactionImg.value);
});
</script>

<template>
  <div class="relative animate-rotate-y animate-once animate-delay-100" :class="p.status === 'my'
    ? characterName === 'nabenabe' ? `left-2 top-7` : `left-2`
    : `left-2 top-5`">
    <img v-if="characterName" :src="`/img/characters/${characterName}/${reactionImg}.png`"
      :class="status === 'my' ? `scale-150` : `scale-150 scale-x-[-1.5]`" />
    <div v-if="retainedDef" class="fixed top-3/4 font-bold text-5xl text-border text-red-500"
      :class="[p.status === 'my' ? `text-3xl` : `text-xl`, reactionImg === 'def' ? `animate-jump` : null]">
      {{ "🛡" + retainedDef }}
    </div>
  </div>
</template>
