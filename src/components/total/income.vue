
<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '@/firebase'

const incomes = ref(0)
const loading = ref(true)
const error = ref('')

const fetchIncomes = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Пользователь не авторизован')

    // Создаем запрос к коллекции cards, где userId совпадает с текущим пользователем
    const cardsRef = collection(db, 'cards')
    const q = query(cardsRef, where('userId', '==', user.uid))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Суммируем все доходы (income) из найденных карт
      let totalIncomes = 0
      querySnapshot.forEach((doc) => {
        const cardData = doc.data()
        totalIncomes += cardData.income || 0
      })
      incomes.value = totalIncomes
    } else {
      incomes.value = 0 // Если карт не найдено
    }
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки доходов'
    console.error('Ошибка при получении доходов:', err)
    incomes.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchIncomes()
})
</script>

<template>
  <main class="total">
    <div class="total__content">
      <div class="total__content__image">
        <img src="../../../public/total/income.svg" alt="Доходы">
      </div>
      <div class="total__content__text">
        <p>Доход</p>
        <h1 v-if="!loading">${{ incomes }}</h1>
        <h1 v-else>Загрузка...</h1>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </main>
</template>
<style>
@import "./balanse.scss";
</style>