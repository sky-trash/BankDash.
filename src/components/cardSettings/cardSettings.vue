<script setup lang="ts">
import { ref } from 'vue';

const hoveredCard = ref<number | null>(null);

const handleMouseEnter = (index: number) => {
  hoveredCard.value = index;
};

const handleMouseLeave = () => {
  hoveredCard.value = null;
};
</script>

<template>
  <main class="cardSettings">
    <div class="cardSettings__text">
      <h1>Настройки карты</h1>
    </div>
    <div class="cardSettings__content">
      <div class="cardSettings__content__container">
        <div 
          class="cardSettings__content__container__card"
          @mouseenter="handleMouseEnter(0)"
          @mouseleave="handleMouseLeave"
        >
          <div class="cardSettings__content__container__card__image">
            <img src="../../../public/cardSettings/block.svg" alt="">
          </div>
          <div class="cardSettings__content__container__card__text">
            <h1>Заблокировать карту</h1>
            <p>Заблокируйте вашу карту</p>
          </div>
          <div 
            class="cardSettings__content__time"
            v-show="hoveredCard === 0"
          >
            <h2>В разработке</h2>
          </div>
        </div>
        <div 
          class="cardSettings__content__container__card"
          @mouseenter="handleMouseEnter(1)"
          @mouseleave="handleMouseLeave"
        >
          <div class="cardSettings__content__container__card__image">
            <img src="../../../public/cardSettings/pin.svg" alt="">
          </div>
          <div class="cardSettings__content__container__card__text">
            <h1>Поменять пин-код</h1>
            <p>Выберите другой пин-код</p>
          </div>
          <div 
            class="cardSettings__content__time"
            v-show="hoveredCard === 1"
          >
            <h2>В разработке</h2>
          </div>
        </div>
        <div 
          class="cardSettings__content__container__card"
          @mouseenter="handleMouseEnter(2)"
          @mouseleave="handleMouseLeave"
        >
          <div class="cardSettings__content__container__card__image">
            <img src="../../../public/cardSettings/google.svg" alt="">
          </div>
          <div class="cardSettings__content__container__card__text">
            <h1>Добавить в Google Pay</h1>
            <p>Оплатить с помощью NFC</p>
          </div>
          <div 
            class="cardSettings__content__time"
            v-show="hoveredCard === 2"
          >
            <h2>В разработке</h2>
          </div>
        </div>
        <div 
          class="cardSettings__content__container__card"
          @mouseenter="handleMouseEnter(3)"
          @mouseleave="handleMouseLeave"
        >
          <div class="cardSettings__content__container__card__image">
            <img src="../../../public/cardSettings/apple2.svg" alt="">
          </div>
          <div class="cardSettings__content__container__card__text">
            <h1>Добавить в Apple Pay</h1>
            <p>Оплатить с помощью NFC</p>
          </div>
          <div 
            class="cardSettings__content__time"
            v-show="hoveredCard === 3"
          >
            <h2>В разработке</h2>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped>
@import "./cardSettings.scss";
</style>