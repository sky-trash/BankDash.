<script setup>
import { ref, onMounted } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase'

const expenses = ref(0)
const loading = ref(true)
const error = ref('')

const fetchExpenses = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Пользователь не авторизован')

    const docRef = doc(db, 'users', user.uid) // Предполагаем, что расходы хранятся в коллекции users
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      // Если expenses равно null или undefined, устанавливаем 0
      expenses.value = docSnap.data().expenses ?? 0
    } else {
      expenses.value = 0 // Если документ не существует
    }
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки расходов'
    console.error('Error fetching expenses:', err)
    expenses.value = 0 // При ошибке тоже показываем 0
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