<script setup>
import { ref, onMounted } from 'vue'
import { getDatabase, ref as dbRef, query, orderByChild, limitToLast, get } from 'firebase/database'

const transactions = ref([])

onMounted(async () => {
  try {
    const db = getDatabase()
    const transactionsRef = dbRef(db, 'transactions')
    
    // Создаем запрос для последних 3 транзакций
    const recentTransactionsQuery = query(
      transactionsRef,
      orderByChild('date'),
      limitToLast(3)
    )

    // Получаем данные
    const snapshot = await get(recentTransactionsQuery)
    
    if (snapshot.exists()) {
      // Преобразуем данные в массив и сортируем по дате (новые сначала)
      const data = snapshot.val()
      transactions.value = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      console.log("Нет доступных транзакций")
    }
  } catch (error) {
    console.error("Ошибка при получении транзакций:", error)
  }
})

// Функция для форматирования даты
const formatDate = (dateString) => {
  const options = { day: 'numeric', month: 'short', year: 'numeric' }
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', options)
}

// Функция для форматирования номера карты
const formatCardNumber = (cardNumber) => {
  return cardNumber.replace(/\d{4}(?= \d{4})/g, '****')
}
</script>

<template>
  <main class="lastHistory">
    <div class="lastHistory__content">
      <div class="lastHistory__content__text">
        <h1>Последние транзакции</h1>
      </div>
      <div class="lastHistory__content__cards">
        <!-- Статический пример карточки (можно удалить) -->
        <div class="lastHistory__content__cards__info" v-if="transactions.length === 0">
          <div class="lastHistory__content__cards__info__image">
            <img src="../../../public/total/history.svg" alt="История">
          </div>
          <div class="lastHistory__content__cards__info__text">
            <h1>Денежный перевод</h1>
            <p>25 Янв 2025</p>
          </div>
          <div class="lastHistory__content__cards__info__transfer">
            <p>Перевод</p>
          </div>
          <div class="lastHistory__content__cards__info__number">
            <p>**** 2324</p>
          </div>
          <div class="lastHistory__content__cards__info__status">
            <p>Выполнено</p>
          </div>
          <div class="lastHistory__content__cards__info__money">
            <p>-40$</p>
          </div>
        </div>
        
        <!-- Динамические карточки транзакций -->
        <div 
          class="lastHistory__content__cards__info" 
          v-for="transaction in transactions" 
          :key="transaction.id"
        >
          <div class="lastHistory__content__cards__info__image">
            <img src="../../../public/total/history.svg" alt="">
          </div>
          <div class="lastHistory__content__cards__info__text">
            <h1>Первод денежных средств</h1>
            <p>{{ formatDate(transaction.date) }}</p>
          </div>
          <div class="lastHistory__content__cards__info__transfer">
            <p>Перевод</p>
          </div>
          <div class="lastHistory__content__cards__info__number">
            <p>{{ formatCardNumber(transaction.card) }}</p>
          </div>
          <div 
            class="lastHistory__content__cards__info__status"
            :class="{
              'status-completed': transaction.status === 'Completed',
              'status-pending': transaction.status === 'Pending'
            }"
          >
            <p>{{ transaction.status }}</p>
          </div>
          <div 
            class="lastHistory__content__cards__info__money"
            :class="{
              'money-positive': transaction.amount > 0,
              'money-negative': transaction.amount < 0
            }"
          >
            <p>{{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }}$</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped>
@import "./lastHistory.scss";
</style>