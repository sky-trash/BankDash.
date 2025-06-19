<script setup lang="ts">
import Cards from '../cards/cards.vue'
import CardsTwo from '../cards/cards-two.vue'
import CardsCredit from '../cards/cardsCredit.vue'

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
  </main>
</template>
<style scoped lang="scss">
@import './home.scss';
</style>