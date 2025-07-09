<script setup lang="ts">
import { ref, watch } from "vue";
import { useSound } from "@vueuse/sound";
import { popUp } from "@/assets/sounds";
import type { Card } from "@/types";
import VDuringPress from "@/components/common/VDuringPress.vue";
import bg from "@/assets/img/ui/22x.webp";
import { wait } from "@/server/utils";

const p = defineProps<{
  card: Card;
  size: "normal" | "big";
  state?: boolean;
  index: number;
}>();

const usePopUp = useSound(popUp);

const dropDown = ref(false);
const cardElementRef = ref<HTMLElement>();

const onLongPressCallbackHook = (): void => {
  console.log("longPress");
  dropDown.value = true;
  usePopUp.play();
};
const onKeyUpCallbackHook = (): void => {
  dropDown.value = false;
};

// カードの実際の位置を取得して表示位置を計算
const getDropDownStyle = () => {
  if (!cardElementRef.value) return {};

  const rect = cardElementRef.value.getBoundingClientRect();
  const dropdownWidth = p.card.description ? 270 : 180;
  const dropdownHeight = p.card.description ? 128 : 64;

  let left = rect.left;
  let top;

  if (p.size === 'big') {
    // ショップオファーカードの場合、常にカードの下に表示
    // カードの親要素の変換を確認して補正
    const parentElement = cardElementRef.value.parentElement;
    let transformOffset = 0;

    if (parentElement) {
      try {
        const computedStyle = window.getComputedStyle(parentElement);
        const transform = computedStyle.transform;

        // transform matrix から translateY の値を取得
        if (transform && transform !== 'none') {
          const matrix = transform.match(/matrix.*\((.+)\)/);
          if (matrix) {
            const values = matrix[1].split(', ');
            if (values.length >= 6) {
              const translateY = parseFloat(values[5]);
              if (translateY < 0) {
                // 負の値（上向きの移動）なので、その分を補正
                transformOffset = Math.abs(translateY);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Transform detection failed:', error);
        // フォールバック: クラスベースの検出
        if (parentElement.classList.contains('transform') &&
          parentElement.classList.contains('-translate-y-5')) {
          transformOffset = 20;
        }
      }
    }

    top = rect.bottom + transformOffset + 8;
  } else {
    top = rect.top - dropdownHeight - 8;
    if (top < 10) {
      top = rect.bottom + 8;
    }
  }

  // 画面境界での調整
  if (left + dropdownWidth > window.innerWidth - 8) {
    left = window.innerWidth - dropdownWidth - 8;
  }
  if (left < 8) {
    left = 8;
  }

  return {
    left: `${Math.max(0, left)}px`,
    top: `${Math.max(0, top)}px`
  };
};

const wastedClass = ref("");
watch(
  () => p.card.waste,
  (newVal, oldVal) => {
    //増えたらshake
    if (newVal < oldVal) {
      wastedClass.value = "animate-jump";
      wait(1000).then(() => {
        wastedClass.value = "animate-stop";
      });
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="relative">
    <!-- Portal-like approach for dropdown - completely escapes parent containers -->
    <Teleport to="body" v-if="dropDown">
      <div class="fixed inset-0 pointer-events-none z-[10000]">
        <div class="absolute pointer-events-auto text-gray-900 text-left shadow-lg" :class="[
          card.description ? `w-[max(20vw,270px)]` : `w-[max(15vw,180px)]`
        ]" :style="getDropDownStyle()">
          <div :class="[card.description ? `w-[max(20vw,270px)]` : `w-[max(15vw,180px)]`]">
            <img :src="bg" class="absolute" style="pointer-events: auto !important; overflow: visible !important;" />
            <div v-if="card.description" class="absolute pb-4 pt-3 px-5">
              <p class="font-bold">{{ card.company + " : " + card.name }}</p>
              <p>{{ card.description }}</p>
            </div>
            <div v-else class="absolute pb-4 pt-2 px-4">
              <p class="font-bold">{{ card.company }}</p>
              <p>{{ card.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    <div ref="cardElementRef" class="relative"
      :class="size === 'normal' ? `w-[min(20vw,100px)]` : `w-[min(30vw,150px)]`">
      <VDuringPress :onKeyDown="onLongPressCallbackHook" :onKeyUp="onKeyUpCallbackHook" :delay="250">
        <img :src="`/img/companys/${card.company}.webp`" />
        <div class="overText">
          <div v-if="card.waste" class="font-bold text-center select-none" :class="[
            size === 'normal'
              ? `text-[min(120%,1.5rem)] -translate-x-[min(7vw,1.9rem)] translate-y-[min(4.2vw,1.3rem)]`
              : `text-[min(170%,1.8rem)] -translate-x-[min(11vw,2.9rem)] translate-y-[min(7vw,2.2rem)]`,
            card.waste === 1 ? `-translate-x-[380%]` : null,
          ]">
            <div :class="wastedClass" class="absolute">
              {{ card.waste }}
            </div>
          </div>
          <div class="p-2" />
          <img v-if="card.waste" :src="`/img/foods/${card.id}.webp`" class="transform"
            :class="size === 'normal' ? `-translate-x-1 translate-y-2` : `-translate-x-[10%] translate-y-[20%]`" />

          <div class="flex font-black text-border-thin transform select-none"
            :class="size === 'normal' ? `text-[min(70%,1rem)] -translate-x-[10%]` : `text-[min(130%,1.5rem)] -translate-x-[10%]`">
            <p v-if="card.hungry !== undefined && card.id !== 0">{{ "🍖" + card.hungry }}</p>
            <p v-if="card.atk">{{ "💪" + card.atk }}</p>
            <p v-if="card.def">{{ "🛡" + card.def }}</p>
            <p v-if="card.tech">{{ "⚡️" + card.tech }}</p>
            <p v-if="card.heal">{{ "💖" + card.heal }}</p>
          </div>
        </div>
        <div v-if="card.description && card.id !== 0" class="relative">
          <img :src="`/img/showSpecial/${card.company}.webp`" class="absolute"
            :class="size === 'normal' ? `w-6 -top-20 left-16` : `w-8 -top-32 right-2`" />
        </div>
        <div v-if="card.isSale" class="relative">
          <img :src="`/img/sale/${card.company}.webp`" class="absolute"
            :class="size === 'normal' ? `w-7 -top-24 left-0` : `w-10 -top-36 left-0`" />
        </div>
      </VDuringPress>
    </div>
  </div>
</template>
