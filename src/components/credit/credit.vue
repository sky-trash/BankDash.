<script setup>
import Dash from "../layout/dash/dash.vue"
import Header from "../layout/header/header.vue"
import Cards from "../cards/cards.vue";
import CardsTwo from '../cards/cards-two.vue'
import CardsCredit from "../cards/cardsCredit.vue";
import CardList from "../cardList/cardList.vue"
import AddCard from "../button/addCard.vue";
import CardSettings from "../cardSettings/cardSettings.vue";
</script>

<template>
  <div class="app-container">
    <Dash />
    <div class="content-area">
      <Header />
      <main class="credit">
        <div class="credit__cards">
          <Cards/>
          <CardsTwo/>
          <CardsCredit/>
        </div>
        <div class="credit__list">
          <CardList/>
        </div>
        <div class="credit__add">
          <AddCard/>
          <CardSettings/>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.dash {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 249px;
  background: #fff;
  border-right: 1px solid #e6eff5;
  z-index: 10;
}

.content-area {
  flex: 1;
  margin-left: 249px; /* Ширина бокового меню */
}

.header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

</style>
<style scoped lang="scss">
@import './credit.scss';
</style>