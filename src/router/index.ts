import { createRouter, createWebHashHistory } from "vue-router";
const Home = () => import("../views/index.vue");
const Menu = () => import("../views/menu.vue");
const Battle = () => import("../views/battle.vue");
const Test = () => import("../views/test.vue");

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/menu",
      name: "menu",
      component: Menu,
    },
    {
      path: "/battle/:idGame",
      name: "battle",
      component: Battle,
    },
    {
      path: "/test",
      name: "test",
      component: Test,
    },
  ],
});

export default router;
