<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { getAuth } from 'firebase/auth';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  fromCard: string;
  status: string;
  toCard: string;
  toUser: string;
  type: string;
  userId: string;
}

const transactions = ref<Transaction[]>([]);
const loading = ref(true);
const error = ref('');

const fetchLastTransactions = async () => {
  try {
    loading.value = true;
    error.value = '';
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      error.value = 'Пользователь не авторизован';
      loading.value = false;
      return;
    }

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(3)
    );

    const querySnapshot = await getDocs(q);
    transactions.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes('index')) {
        error.value = 'Необходимо создать индекс в Firebase.';
        const urlMatch = err.message.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          console.error('Ссылка для создания индекса:', urlMatch[0]);
        }
      } else {
        error.value = 'Ошибка при загрузке транзакций: ' + err.message;
      }
      console.error(err);
    } else {
      error.value = 'Неизвестная ошибка при загрузке транзакций';
      console.error(err);
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLastTransactions();
});
</script>

<template>
  <main class="lastHistory">
    <div v-if="loading">Загрузка...</div>
    <div v-else-if="error" class="error">
      {{ error }}
      <a v-if="error.includes('индекс') && error.match(/https?:\/\/[^\s]+/)?.[0]" 
         :href="error.match(/https?:\/\/[^\s]+/)?.[0]" 
         target="_blank">
        Создать индекс
      </a>
    </div>
    <div v-else>
      <h2>Ваши последние 3 транзакции</h2>
      <div v-if="transactions.length === 0">Нет транзакций</div>
      <ul v-else class="transactions-list">
        <li v-for="transaction in transactions" :key="transaction.id" class="transaction-item">
          <div class="transaction-info">
            <div><strong>Сумма:</strong> {{ transaction.amount }}</div>
            <div><strong>Дата:</strong> {{ new Date(transaction.date).toLocaleString() }}</div>
            <div v-if="transaction.fromCard">
              <strong>От карты:</strong> **** **** **** {{ transaction.fromCard.slice(-4) }}
            </div>
            <div v-if="transaction.toCard">
              <strong>На карту:</strong> **** **** **** {{ transaction.toCard.slice(-4) }}
            </div>
            <div><strong>Тип:</strong> {{ transaction.type === 'outgoing' ? 'Отправка' : 'Получение' }}</div>
            <div>
              <strong>Статус:</strong> 
              {{ transaction.status === 'completed' ? 'Завершено' : 
                 transaction.status === 'pending' ? 'В обработке' : 
                 transaction.status }}
            </div>
          </div>
        </li>
      </ul>
    </div>
  </main>
</template>

<style scoped>
.lastHistory {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.transactions-list {
  list-style: none;
  padding: 0;
}

.transaction-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
}

.transaction-info div {
  margin-bottom: 5px;
}

.error {
  color: red;
  font-weight: bold;
}

.error a {
  color: #0066cc;
  text-decoration: underline;
  margin-left: 5px;
}
</style>

<style scoped>
@import "./lastHistory.scss";
</style>