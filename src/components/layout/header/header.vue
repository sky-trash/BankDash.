<script setup lang="ts">

</script>
<template>
  <header class="header">
    <div class="header__overview">
      <h1>Обзор</h1>
    </div>
    <div class="header__search">
      <input class="search-input" type="text" placeholder="Поиск по сайту" aria-label="Search">
      <img src="../../../../public/header/search.svg" alt="Search icon">
    </div>
    <div class="header__settings">
      <button>
        <img src="../../../../public/header/settings.svg" alt="">
      </button>
    </div>
    <div class="header__notifications">
      <button>
        <img src="../../../../public/header/notifications.svg" alt="">
      </button>
    </div>
    <div class="header__cabinet">
      <button>
        <img src="../../../../public/header/cabinet.svg" alt="">
      </button>
    </div>
  </header>
</template>
<style scoped>
@import "./header.scss";
</style>