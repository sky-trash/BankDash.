<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CardDetailsModal from './CardDetailsModal.vue';

interface Card {
  id: string;
  type: string;
  cardNumber: string;
  cardHolder: string;
  validThru: string;
  cvv: string;
  isActive: boolean;
  userId: string;
  createdAt: any;
  balance?: number;
  creditLimit?: number;
}

const auth = getAuth();
const cards = ref<Card[]>([]);
const selectedCard = ref<Card | null>(null);
const loading = ref(true);

const getLastFourDigits = (cardNumber: string) => {
  if (!cardNumber) return '';
  const cleaned = cardNumber.replace(/\s/g, '');
  return cleaned.slice(-4);
};

const getCardImage = (type: string) => {
  return type === 'credit' 
    ? '/public/total/cardCredit-list.svg' 
    : '/public/total/card-list.svg';
};

const fetchUserCards = async () => {
  try {
    loading.value = true;
    const user = auth.currentUser;

    if (!user) {
      console.error('No authenticated user');
      return;
    }

    // Запрашиваем карты из всех трех коллекций параллельно
    const [cardsSnapshot, cardsTwoSnapshot, creditSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'cards'), where('userId', '==', user.uid))),
      getDocs(query(collection(db, 'cards-two'), where('userId', '==', user.uid))),
      getDocs(query(collection(db, 'credit'), where('userId', '==', user.uid)))
    ]);

    // Объединяем все карты в один массив
    cards.value = [
      ...cardsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        type: 'debit',
        source: 'cards' // Добавляем источник для отладки
      })),
      ...cardsTwoSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        type: 'debit',
        source: 'cards-two' // Добавляем источник для отладки
      })),
      ...creditSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        type: 'credit',
        source: 'credit' // Добавляем источник для отладки
      }))
    ] as Card[];
  } catch (error) {
    console.error('Error fetching user cards:', error);
  } finally {
    loading.value = false;
  }
};

const showCardDetails = (card: Card) => {
  selectedCard.value = card;
};

onMounted(() => {
  fetchUserCards();
});
</script>

<template>
  <div class="cardList">
    <h1>Мои карты</h1>
    <div v-if="loading" class="loading">Загрузка карт...</div>
    <div v-else-if="cards.length === 0" class="no-cards">
      <p>У вас нет карт</p>
    </div>
    <div class="cardList__content" v-else>
      <div 
        class="cardList__content__cards" 
        v-for="card in cards" 
        :key="card.id"
        :class="{'card-secondary': card.source === 'cards-two'}"
      >
        <div class="cardList__content__cards__image">
          <img 
            :src="getCardImage(card.type)" 
            :alt="card.type === 'credit' ? 'Кредитная карта' : 'Дебетовая карта'"
          >
        </div>
        <div class="cardList__content__cards__type">
          <h1>Тип карты</h1>
          <p>
            {{ card.type === 'credit' ? 'Кредитная' : 'Дебетовая' }}
            <span v-if="card.source === 'cards-two'" class="card-tag">Дополнительная</span>
          </p>
        </div>
        <div class="cardList__content__cards__bank">
          <h1>Банк</h1>
          <p>BankDash.</p>
        </div>
        <div class="cardList__content__cards__number">
          <h1>Номер карты</h1>
          <p>**** **** {{ getLastFourDigits(card.cardNumber) }}</p>
        </div>
        <div class="cardList__content__cards__name">
          <h1>Владелец карты</h1>
          <p>{{ card.cardHolder }}</p>
        </div>
        <div class="cardList__content__cards__button">
          <h1 @click="showCardDetails(card)">Реквизиты карты</h1>
        </div>
      </div>
      <CardDetailsModal v-if="selectedCard" :card="selectedCard" @close="selectedCard = null" />
    </div>
  </div>
</template>

<style scoped>
@import "./cardList.scss";
</style>