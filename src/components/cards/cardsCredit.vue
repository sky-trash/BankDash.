<script setup lang="ts">

</script>

<template>
  <main class="cardsCredit">
    <div class="cardsCredit__all">
      <h1>Кредитная карта</h1>
    </div>
    <div class="cardsCredit__card">
      <div class="cardsCredit__card__chip">
        <div class="cardsCredit__card__chip__balanse">
          <p>Баланс</p>
          <h1>$20000</h1>
        </div>
        <div class="cardsCredit__card__chip__image">
          <img src="../../../public/cards/chip-silver.svg" alt="Чип карты">
        </div>
      </div >
      <div class="cardsCredit__card__castom">
        <div class="cardsCredit__card__castom__holder">
          <p>Card Holder</p>
          <h1>Matveev Evgeniy</h1>
        </div>
        <div class="cardsCredit__card__castom__volid">
          <p>Valid THRU</p>
          <h1>09/22</h1>
        </div>
      </div>
      <div class="cardsCredit__card__number">
        <div class="cardsCredit__card__number__text">
          <p>9009 7364 6254 7829</p>
        </div>
        <div class="cardsCredit__card__number__image">
          <img src="../../../public/cards/master-silver.svg" alt="Mastercard">
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import "./cardsCredit.scss";

.loading, .error, .no-card {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}
</style>