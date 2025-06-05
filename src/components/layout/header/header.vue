<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

// Карта соответствий путей и названий
const pageTitles = {
  '/': 'Главная',
  '/transfer': 'Транзакции',
  '/user': 'Аккаунт',
  '/investment': 'Инвестиции',
  '/credit': 'Кредит',
  '/settings': 'Настройки'
};

// Получаем название текущей страницы
const currentPageTitle = computed(() => {
  const basePath = route.path.split('/')[1];
  return pageTitles[`/${basePath}`] || 'Главная';
});
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
      <router-link to="/settings" class="header__content__cabinet">
        <button>
          <img src="../../../../public/header/cabinet.svg" alt="">
        </button>
      </router-link>
    </div>
  </header>
</template>

<style scoped>
@import "./header.scss";
</style>