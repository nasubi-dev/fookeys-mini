import { createApp } from "vue";
import { createPinia } from "pinia";
import { notivue } from "notivue";
import { usePlayerStore, useEnemyPlayerStore, useGameStore } from "./store";
import App from "./App.vue";
import router from "./router";
import "./main.css";
import "notivue/notifications.css";
import "notivue/animations.css";

const pinia = createPinia();
createApp(App)
  .use(router)
  .use(pinia)
  .use(notivue, {
    limit: 5,
  })
  .mount("#app");

const playerStore = usePlayerStore();
const enemyPlayerStore = useEnemyPlayerStore();
const gameStore = useGameStore();

export { playerStore, enemyPlayerStore, gameStore };
