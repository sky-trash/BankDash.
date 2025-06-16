<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const transactions = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchLastTransactions = async () => {
  try {
    if (!auth.currentUser) {
      error.value = 'Пользователь не авторизован';
      isLoading.value = false;
      return;
    }
    
    const historyRef = collection(db, 'history');
    const q = query(
      historyRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc'),
      limit(3)
    );
    
    const querySnapshot = await getDocs(q);
    transactions.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('Ошибка загрузки транзакций:', err);
    error.value = 'Ошибка загрузки истории транзакций';
    
    if (err.code === 'failed-precondition') {
      error.value = 'Пожалуйста, подождите несколько минут, пока система обновляется';
    }
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return '**** ****';
  const cleanNum = cardNumber.replace(/\D/g, '');
  const last4 = cleanNum.slice(-4);
  return `**** ${last4}`;
};

const getTransactionDescription = (type) => {
  switch(type) {
    case 'transfer': return 'Перевод';
    case 'payment': return 'Оплата';
    case 'deposit': return 'Пополнение';
    default: return 'Транзакция';
  }
};

const getTransactionType = (direction) => {
  switch(direction) {
    case 'outgoing': return 'Отправлено';
    case 'incoming': return 'Получено';
    default: return direction;
  }
};

const getStatusText = (status) => {
  switch(status) {
    case 'completed': return 'Выполнено';
    case 'pending': return 'Ожидание';
    case 'error': return 'Ошибка';
    default: return status;
  }
};

onMounted(() => {
  fetchLastTransactions();
});
</script>

<template>
  <main class="lastHistory">
    <div class="lastHistory__content">
      <div class="lastHistory__content__text">
        <h1>История транзакций</h1>
      </div>

      <div v-if="isLoading" class="lastHistory__content__empty">
        <p>Загрузка...</p>
      </div>

      <div v-else-if="error" class="lastHistory__content__error">
        <p>{{ error }}</p>
        <p v-if="error.includes('Пожалуйста, подождите')">
          <a :href="`https://console.firebase.google.com/v1/r/project/bankdash-d1a91/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9iYW5rZGFzaC1kMWE5MS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvaGlzdG9yeS9pbmRleGVzL18QARoKCgZ1c2VySWQQARoICgRkYXRlEAIaDAoIX19uYW1lX18QAg`"
             target="_blank" class="error-link">
            Создать индекс вручную (требуются права администратора)
          </a>
        </p>
      </div>

      <div v-else-if="transactions.length > 0" class="lastHistory__content__cards">
        <div v-for="transaction in transactions" :key="transaction.id" class="lastHistory__content__cards__info">
          <div class="lastHistory__content__cards__info__image">
            <img src="../../../public/total/history.svg" alt="Транзакция">
          </div>
          <div class="lastHistory__content__cards__info__text">
            <h3>{{ getTransactionDescription(transaction.type) }}</h3>
            <p class="date">{{ formatDate(transaction.date) }}</p>
          </div>
          <div class="lastHistory__content__cards__info__transfer">
            <p>{{ getTransactionType(transaction.direction) }}</p>
          </div>
          <div class="lastHistory__content__cards__info__number">
            <p>{{ formatCardNumber(transaction.cardNumber) }}</p>
            <p v-if="transaction.userName">→ {{ transaction.userName }}</p>
          </div>
          <div class="lastHistory__content__cards__info__status" :class="{
            'completed': transaction.status === 'completed',
            'pending': transaction.status === 'pending',
            'error': transaction.status === 'error'
          }">
            <p>{{ getStatusText(transaction.status) }}</p>
          </div>
          <div class="lastHistory__content__cards__info__money" :class="{
            'income': transaction.direction === 'incoming',
            'outcome': transaction.direction === 'outgoing'
          }">
            <p>{{ transaction.direction === 'incoming' ? '+' : '-' }}{{ Math.abs(transaction.amount) }}$</p>
          </div>
        </div>
      </div>

      <div v-else class="lastHistory__content__empty">
        <p>У вас пока нет транзакций</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import "./lastHistory.scss";
</style>