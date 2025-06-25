<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
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
  userName: string;
}

const transactions = ref<Transaction[]>([]);
const visibleTransactions = ref<Transaction[]>([]);
const loading = ref(true);
const error = ref('');
const showCount = ref(10);
const activeFilter = ref<'all' | 'outgoing' | 'incoming'>('all');

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') return transactions.value;
  return transactions.value.filter(t => t.type === activeFilter.value);
});

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
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    transactions.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
    
    updateVisibleTransactions();
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

const applyFilter = (filter: 'all' | 'outgoing' | 'incoming') => {
  activeFilter.value = filter;
  showCount.value = 10;
  updateVisibleTransactions();
};

const formatDate = (date: any) => {
  try {
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return 'Дата не указана';
  } catch {
    return 'Дата не указана';
  }
};

const showMore = () => {
  showCount.value += 10;
  updateVisibleTransactions();
};

const updateVisibleTransactions = () => {
  visibleTransactions.value = filteredTransactions.value.slice(0, showCount.value);
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
        :href="error.match(/https?:\/\/[^\s]+/)?.[0]" target="_blank">
        Создать индекс
      </a>
    </div>
    <div v-else>
      <div class="lastHistory__header">
        <div class="lastHistory__header__text">
          <h1>История транзакции</h1>
        </div>
        <div class="lastHistory__header__filters">
          <button 
            class="lastHistory__header__filters__button"
            :class="{ 'active-filter': activeFilter === 'all' }"
            @click="applyFilter('all')"
          >
            Все
          </button>
          <button 
            class="lastHistory__header__filters__button"
            :class="{ 'active-filter': activeFilter === 'incoming' }"
            @click="applyFilter('incoming')"
          >
            Получения
          </button>
          <button 
            class="lastHistory__header__filters__button"
            :class="{ 'active-filter': activeFilter === 'outgoing' }"
            @click="applyFilter('outgoing')"
          >
            Отправки
          </button>
        </div>
      </div>
      <div class="lastHistory__content">
        <div v-if="filteredTransactions.length === 0" class="lastHistory__content__card">
          <div class="lastHistory__content__card__type">
            <h1>Нет транзакций</h1>
          </div>
        </div>
        <div v-else>
          <div v-for="transaction in visibleTransactions" :key="transaction.id" class="lastHistory__content__card">
            <div class="lastHistory__content__card__image">
              <img src="../../../public/total/history.svg" alt="История транзакций">
            </div>
            <div class="lastHistory__content__card__date">
              <h1>{{ formatDate(transaction.date) }}</h1>
            </div>
            <div class="lastHistory__content__card__type">
              <h1>{{ transaction.type === 'outgoing' ? 'Отправка' : 'Получение' }}</h1>
            </div>
            <div class="lastHistory__content__card__number">
              <h1 v-if="transaction.type === 'outgoing' && transaction.toCard">
                **** {{ transaction.toCard.slice(-4) }}
              </h1>
              <h1 v-else-if="transaction.fromCard">
                **** {{ transaction.fromCard.slice(-4) }}
              </h1>
            </div>
            <div class="lastHistory__content__card__status">
              <h1>
                {{ transaction.status === 'completed' ? 'Завершено' :
                  transaction.status === 'pending' ? 'В обработке' :
                    transaction.status }}
              </h1>
            </div>
            <div class="lastHistory__content__card__money">
              <h1 :class="{
                'money-outgoing': transaction.type === 'outgoing',
                'money-incoming': transaction.type !== 'outgoing'
              }">
                {{ transaction.type === 'outgoing' ? '-' : '+' }}{{ transaction.amount }}$
              </h1>
            </div>
          </div>

          <div v-if="filteredTransactions.length > visibleTransactions.length" class="lastHistory__content__show">
            <button class="lastHistory__content__show__button" @click="showMore">
              <p>Показать еще</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import "./lastHistory.scss";

.error {
  color: red;
}
</style>