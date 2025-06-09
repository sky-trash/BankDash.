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
      console.log("No transactions available")
    }
  } catch (error) {
    console.error("Error fetching transactions:", error)
  }
})
</script>

<template>
  <main class="lastHistory">
    <div class="lastHistory__content">
      <div class="lastHistory__content__text">
        <h1>Последние транзакции</h1>
      </div>
      <div class="lastHistory__content__table">
        <table>
          <thead>
            <tr>
              <th>Описание</th>
              <th>Категория</th>
              <th>Карта</th>
              <th>Статус</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in transactions" :key="transaction.id">
              <td>{{ transaction.description }}</td>
              <td>{{ transaction.category }}</td>
              <td>{{ transaction.card }}</td>
              <td :class="{
                'status-pending': transaction.status === 'Pending',
                'status-completed': transaction.status === 'Completed'
              }">
                {{ transaction.status }}
              </td>
              <td :class="{
                'amount-negative': transaction.amount < 0,
                'amount-positive': transaction.amount > 0
              }">
                {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }}$
              </td>
            </tr>
            <tr v-if="transactions.length === 0">
              <td colspan="5">Нет транзакций</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
<style scoped>
@import "./lastHistory.scss";
</style>