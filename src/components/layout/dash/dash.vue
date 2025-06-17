<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <div class="dash">
    <div class="dash__logo">
      <img src="../../../../public/dash/Logo.svg" alt="logo">
    </div>
    <nav class="dash__nav">
      <router-link 
        to="/" 
        class="dash__nav__link"
        :class="{ 'is-active': route.path === '/' }"
      >
        <img class="rectangle" src="../../../../public/dash/Rectangle.svg" alt="">
        <img class="icon icon-white" src="../../../../public/dash/white/home.svg" alt="">
        <img class="icon icon-blue" src="../../../../public/dash/blue/home-blue.svg" alt="">
        <h1>Главная</h1>
      </router-link>
      
      <router-link 
        to="/transfer" 
        class="dash__nav__link"
        :class="{ 'is-active': route.path === '/transfer' }"
      >
        <img class="rectangle" src="../../../../public/dash/Rectangle.svg" alt="">
        <img class="icon icon-white" src="../../../../public/dash/white/transfer.svg" alt="">
        <img class="icon icon-blue" src="../../../../public/dash/blue/transfer-blue.svg" alt="">
        <h1>Транзакции</h1>
      </router-link>
      
      <router-link 
        to="/user" 
        class="dash__nav__link"
        :class="{ 'is-active': route.path === '/user' }"
      >
        <img class="rectangle" src="../../../../public/dash/Rectangle.svg" alt="">
        <img class="icon icon-white" src="../../../../public/dash/white/user.svg" alt="">
        <img class="icon icon-blue" src="../../../../public/dash/blue/user-blue.svg" alt="">
        <h1>Аккаунт</h1>
      </router-link>
      
      <router-link 
        to="/investment" 
        class="dash__nav__link"
        :class="{ 'is-active': route.path === '/investment' }"
      >
        <img class="rectangle" src="../../../../public/dash/Rectangle.svg" alt="">
        <img class="icon icon-white" src="../../../../public/dash/white/investment.svg" alt="">
        <img class="icon icon-blue" src="../../../../public/dash/blue/investment-blue.svg" alt="">
        <h1>Инвестиции</h1>
      </router-link>
      
      <router-link 
        to="/credit" 
        class="dash__nav__link"
        :class="{ 'is-active': route.path === '/credit' }"
      >
        <img class="rectangle" src="../../../../public/dash/Rectangle.svg" alt="">
        <img class="icon icon-white" src="../../../../public/dash/white/credit.svg" alt="">
        <img class="icon icon-blue" src="../../../../public/dash/blue/credit-blue.svg" alt="">
        <h1>Карты и кредит</h1>
      </router-link>
      
      <router-link 
        to="/settings" 
        class="dash__nav__link"
        :class="{ 'is-active': route.path === '/settings' }"
      >
        <img class="rectangle" src="../../../../public/dash/Rectangle.svg" alt="">
        <img class="icon icon-white" src="../../../../public/dash/white/settings.svg" alt="">
        <img class="icon icon-blue" src="../../../../public/dash/blue/settings-blue.svg" alt="">
        <h1>Настройки</h1>
      </router-link>
    </nav>
  </div>
</template>
<style scoped lang="scss">
  @import "./dash.scss";
</style>