<script setup lang="ts">
import Cards from '../cards/cards.vue'
import CardsTwo from '../cards/cards-two.vue'
import CardsCredit from '../cards/cardsCredit.vue'
import Balanse from '../total/balanse.vue'
import TransferMoney from '../button/transferMoney.vue'
import CardSettings from '../cardSettings/cardSettings.vue'
import Income from '../total/income.vue'

import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase'

const router = useRouter()

const logout = async () => {
  await signOut(auth)
  router.push('/login')
}

</script>
<template>
  <main class="home">
    <div class="home__cards">
      <Cards />
      <CardsTwo/>
      <CardsCredit />
    </div>
    <div class="home__button">
      <Balanse/>
      <Income/>
      <TransferMoney/>
    </div>
    <div class="home__settings">
      <CardSettings/>
    </div>
  </main>
</template>
<style scoped lang="scss">
@import './home.scss';
</style>