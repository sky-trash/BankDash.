<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import { getAuth, signOut } from 'firebase/auth';

const route = useRoute();
const router = useRouter();
const auth = getAuth();
const searchQuery = ref('');

const searchablePages = [
  { path: '/index', title: 'Главная', keywords: ['главная', 'домой'] },
  { path: '/transfer', title: 'Транзакции', keywords: ['перевод', 'транзакция', 'деньги'] },
  { path: '/user', title: 'Аккаунт', keywords: ['профиль', 'аккаунт', 'личный кабинет', 'баланс', 'расход', 'доход', 'история'] },
  { path: '/investment', title: 'Инвестиции', keywords: ['инвестиции', 'акции', 'облигации'] },
  { path: '/credit', title: 'Карты и кредит', keywords: ['кредит', 'карта', 'платеж', 'реквизиты карты', 'заблокировать карту', 'выпустить карту'] },
  { path: '/settings', title: 'Настройки', keywords: ['настройки', 'конфигурация', 'поменять имя', 'поменять фио', 'поменять фамилию', 'номер телефона'] }
];

const pageTitles = {
  '/': 'Главная',
  '/transfer': 'Транзакции',
  '/user': 'Аккаунт',
  '/investment': 'Инвестиции',
  '/credit': 'Карты и кредит',
  '/settings': 'Настройки'
};

const currentPageTitle = computed(() => {
  const basePath = route.path.split('/')[1];
  return pageTitles[`/${basePath}`] || 'Главная';
});

const performSearch = () => {
  if (!searchQuery.value.trim()) return;
  
  // Ищем совпадения в заголовках и ключевых словах
  const results = searchablePages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    page.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
  
  if (results.length > 0) {
    // Перенаправляем на первую найденную страницу
    router.push(results[0].path);
  } else {
    // Можно добавить уведомление, что ничего не найдено
    alert('Ничего не найдено. Попробуйте другой запрос.');
  }
  
  searchQuery.value = '';
};

const logout = async () => {
  try {
    await signOut(auth);
    router.push('/login');
  } catch (error) {
    console.error('Ошибка при выходе:', error);
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
        <input 
          v-model="searchQuery"
          @keyup.enter="performSearch"
          class="search-input" 
          type="text" 
          placeholder="Поиск по сайту" 
          aria-label="Search"
        >
        <img @click="performSearch" src="../../../../public/header/search.svg" alt="Search icon">
      </div>
      <router-link to="/settings" class="header__content__settings">
        <button>
          <img src="../../../../public/header/settings.svg" alt="">
        </button>
      </router-link>
      <router-link to="/user" class="header__content__cabinet">
        <button>
          <img src="../../../../public/login.svg" alt="кабинет">
        </button>
      </router-link>
      <div class="header__content__cabinet">
        <button @click="logout">
          <img id="logout" src="../../../../public/login.svg" alt="Выход">
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
@import "./header.scss";

#logout {
  rotate: 180deg;
}
</style>