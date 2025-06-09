<script setup lang="ts">
import Cards from '../cards/cards.vue'

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
    <Cards/>
  </main>
</template>
<style scoped lang="scss">
@import './home.scss';
</style>