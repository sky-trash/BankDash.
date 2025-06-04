import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("../pages/index.vue"),
      alias: ["/home", "/main"] // Добавляем алиасы для главной
    },
    {
      path: "/transactions",
      name: "transactions",
      component: () => import("../pages/transactions.vue"),
      meta: {
        requiresUnauth: true,
        title: "Транзакции" // Мета-данные для заголовка
      }
    },
    
    // {
    //   path: "/:pathMatch(.*)*", // Более надежный обработчик 404
    //   name: "not-found",
    //   component: () => import("../pages/NotFound.vue"),
    //   meta: {
    //     title: "Страница не найдена"
    //   }
    // }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})


export default router