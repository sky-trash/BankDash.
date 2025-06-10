<script setup>
import { ref, onMounted } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase'

const incomes = ref(0)
const loading = ref(true)
const error = ref('')

const fetchIncomes = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Пользователь не авторизован')

    const docRef = doc(db, 'users', user.uid) // Предполагаем, что расходы хранятся в коллекции users
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      // Если incomes равно null или undefined, устанавливаем 0
      incomes.value = docSnap.data().incomes ?? 0
    } else {
      incomes.value = 0 // Если документ не существует
    }
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки доходов'
    console.error('Ошибка при получении доходов:', err)
    incomes.value = 0 // При ошибке тоже показываем 0
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
        <img src="../../../public/total/income.svg" alt="Расходы">
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