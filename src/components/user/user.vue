<script setup>
import Dash from "../layout/dash/dash.vue"
import Header from "../layout/header/header.vue"
import Balanse from "../total/balanse.vue"
import Expense from "../total/expense.vue"
import Income from "../total/income.vue"
import LastHistory from "../history/lastHistory.vue"
import Cards from "../cards/cards.vue"
</script>

<template>
  <div class="app-container">
    <Dash />
    <div class="content-area">
      <Header />
      <main class="user__content">
        <div class="user__content__cards">
          <Cards />
          <div class="user__content__cards__total">
            <Balanse />
            <Expense />
            <Income />
          </div>
        </div>
        <div class="user__content__history">
          <LastHistory />
        </div>
      </main>
    </div>
  </div>
</template>
<style scoped lang="scss">
@import './user.scss';

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
  margin-left: 249px;
  /* Ширина бокового меню */
}

.header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>