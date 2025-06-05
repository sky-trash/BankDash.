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
      path: "/transfer",
      name: "transfer",
      component: () => import("../pages/transfer.vue"),
      meta: {
        requiresUnauth: true,
        title: "Транзакции" // Мета-данные для заголовка
      }
    },
    {
      path: "/user",
      name: "user",
      component: () => import("../pages/user.vue"),
      meta: {
        requiresUnauth: true,
        title: "Аккаунт" // Мета-данные для заголовка
      }
    },
    {
      path: "/investment",
      name: "investment",
      component: () => import("../pages/investment.vue"),
      meta: {
        requiresUnauth: true,
        title: "Инвестиции" // Мета-данные для заголовка
      }
    },
    {
      path: "/credit",
      name: "credit",
      component: () => import("../pages/credit.vue"),
      meta: {
        requiresUnauth: true,
        title: "Кредит" // Мета-данные для заголовка
      }
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("../pages/settings.vue"),
      meta: {
        requiresUnauth: true,
        title: "Настройки" // Мета-данные для заголовка
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