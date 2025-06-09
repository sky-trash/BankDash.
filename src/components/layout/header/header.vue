<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { getAuth, signOut } from 'firebase/auth';

const route = useRoute();
const router = useRouter();
const auth = getAuth();

const pageTitles = {
  '/': 'Главная',
  '/transfer': 'Транзакции',
  '/user': 'Аккаунт',
  '/investment': 'Инвестиции',
  '/credit': 'Кредит',
  '/settings': 'Настройки'
};

const currentPageTitle = computed(() => {
  const basePath = route.path.split('/')[1];
  return pageTitles[`/${basePath}`] || 'Главная';
});

const logout = async () => {
  try {
    await signOut(auth);
    // Перенаправляем на страницу входа после выхода
    router.push('/login');
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    // Можно добавить уведомление об ошибке
  }
};
</script>

<template>
  <header class="header">
    <div class="header__overview">
      <h1>{{ currentPageTitle }}</h1>
    </div>
    <div class="header__content">
      <div class="header__content__search">
        <input class="search-input" type="text" placeholder="Поиск по сайту" aria-label="Search">
        <img src="../../../../public/header/search.svg" alt="Search icon">
      </div>
      <router-link to="/settings" class="header__content__settings">
        <button>
          <img src="../../../../public/header/settings.svg" alt="">
        </button>
      </router-link>
      <div class="header__content__notifications">
        <button>
          <img src="../../../../public/header/notifications.svg" alt="">
        </button>
      </div>
      <router-link to="/user" class="header__content__cabinet">
        <button>
          <img src="" alt="кабинет">
        </button>
      </router-link>
      <div class="header__content__cabinet">
        <button @click="logout">
          <img src="" alt="Выход">
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
@import "./header.scss";
</style>