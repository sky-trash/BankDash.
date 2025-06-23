import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/login.vue'),
      meta: {
        title: 'Авторизация',
        requiresUnauth: true
      }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/register.vue'),
      meta: {
        title: 'Пегистрация',
        requiresUnauth: true
      }
    },
    {
      path: '/index',
      name: 'index',
      component: () => import('../pages/index.vue'),
      meta: {
        title: 'Главная',
        requiresAuth: true
      }
    },
    {
      path: '/transfer',
      name: 'transfer',
      component: () => import('../pages/transfer.vue'),
      meta: {
        title: 'Переводы',
        requiresAuth: true,
        icon: 'transfer'
      }
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('../pages/user.vue'),
      meta: {
        title: 'Мой профиль',
        requiresAuth: true,
        icon: 'user'
      }
    },
    {
      path: '/investment',
      name: 'investment',
      component: () => import('../pages/investment.vue'),
      meta: {
        title: 'Инвестиции',
        requiresAuth: true,
        icon: 'investment'
      }
    },
    {
      path: '/credit',
      name: 'credit',
      component: () => import('../pages/credit.vue'),
      meta: {
        title: 'Кредиты',
        requiresAuth: true,
        icon: 'credit'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../pages/settings.vue'),
      meta: {
        title: 'Настройки',
        requiresAuth: true,
        icon: 'settings'
      }
    },
    {
      path: '/:pathMatch(.*)*', // Перехват 404
      redirect: '/dashboard' // Перенаправление на главную
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 100 // Отступ сверху для фиксированного header'а
      }
    }
    return savedPosition || { top: 0 }
  }
})

// Глобальная проверка авторизации
router.beforeEach(async (to, from, next) => {
  await auth.authStateReady() // Ждем инициализации auth
  const user = auth.currentUser
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  const requiresUnauth = to.matched.some(r => r.meta.requiresUnauth)

  // Установка заголовка
  document.title = to.meta.title 
    ? `${to.meta.title} | Банковская система` 
    : 'Банковская система'

  if (requiresAuth && !user) {
    // Сохраняем исходный путь для редиректа после входа
    next({ name: 'login', query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined }})
  } else if (requiresUnauth && user) {
    next({ name: 'index' }) // Авторизованных отправляем на главную
  } else {
    next() // Разрешаем переход
  }
})

export default router