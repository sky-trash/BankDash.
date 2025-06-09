<script setup>
import { ref, onMounted } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase' // Убедитесь, что путь правильный

const balance = ref(0)
const loading = ref(true)
const error = ref('')

const fetchBalance = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Пользователь не авторизован')

    const docRef = doc(db, 'cards', user.uid) // Предполагаем, что данные карты хранятся в коллекции cards
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      balance.value = docSnap.data().balance || 0
    } else {
      throw new Error('Данные карты не найдены')
    }
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки баланса'
    console.error('Error fetching balance:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBalance()
})
</script>

<template>
  <main class="total">
    <div class="total__content">
      <div class="total__content__image">
        <img src="../../../public/total/balanse.svg" alt="Баланс">
      </div>
      <div class="total__content__text">
        <p>Баланс</p>
        <h1 v-if="!loading && !error">${{ balance }}</h1>
        <h1 v-else-if="loading">Загрузка...</h1>
        <h1 v-else class="error">{{ error }}</h1>
      </div>
    </div>
  </main>
</template>
<style>
@import "./balanse.scss";
</style>