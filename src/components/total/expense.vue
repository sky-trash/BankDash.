
<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '@/firebase'

const expenses = ref(0)
const loading = ref(true)
const error = ref('')

const fetchExpenses = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Пользователь не авторизован')

    // Создаем запрос к коллекции cards, где userId совпадает с текущим пользователем
    const cardsRef = collection(db, 'cards')
    const q = query(cardsRef, where('userId', '==', user.uid))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Суммируем все расходы (expense) из найденных карт
      let totalExpenses = 0
      querySnapshot.forEach((doc) => {
        const cardData = doc.data()
        totalExpenses += cardData.expense || 0
      })
      expenses.value = totalExpenses
    } else {
      expenses.value = 0 // Если карт не найдено
    }
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки расходов'
    console.error('Ошибка при получении расходов:', err)
    expenses.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchExpenses()
})
</script>

<template>
  <main class="total">
    <div class="total__content">
      <div class="total__content__image">
        <img src="../../../public/total/expense.svg" alt="Расходы">
      </div>
      <div class="total__content__text">
        <p>Расходы</p>
        <h1 v-if="!loading">${{ expenses }}</h1>
        <h1 v-else>Загрузка...</h1>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </main>
</template>

<style>
@import "./balanse.scss";
</style>