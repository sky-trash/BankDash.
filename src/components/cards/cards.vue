<script setup lang="ts">
</script>
<template>
  <main class="cards">
    <div class="cards__all">
      <h1>Мои карты</h1>
    </div>
    <div class="cards__card">
      <div class="cards__card__chip">
        <div class="cards__card__chip__balanse">
          <p>Баланс</p>
          <h1>$1000</h1>
        </div>
        <div class="cards__card__chip__image">
          <img src="../../../public/cards/chip.svg" alt="">
        </div>
      </div>
      <div class="cards__card__castom">
        <div class="cards__card__castom__holder">
          <p>Card Holder</p>
          <h1>Евгений Матвеев</h1>
        </div>
        <div class="cards__card__castom__volid">
          <p>Valid THRU</p>
          <h1>12/26</h1>
        </div>
      </div>
      <div class="cards__card__number">
        <div class="cards__card__number__text">
          <p>3777 8736 8730 7462</p>
        </div>
        <div class="cards__card__number__image">
          <img src="../../../public/cards/master.svg" alt="">
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped lang="scss">
@import './cards.scss';
</style>