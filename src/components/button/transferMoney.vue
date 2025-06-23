<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  runTransaction,
  getDoc
} from 'firebase/firestore';

const isModalOpen = ref(false);
const cardNumber = ref('');
const amount = ref('');
const error = ref('');
const success = ref('');
const isLoading = ref(false);
const userCards = ref([]);
const selectedCard = ref(null);
const cardCollections = ['cards', 'cards-two', 'credit'];

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  error.value = '';
  success.value = '';
  cardNumber.value = '';
  amount.value = '';
};

const formatCardNumberInput = (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 16) value = value.slice(0, 16);
  cardNumber.value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const loadUserCards = async () => {
  try {
    const cards = [];
    
    // Загружаем карты из всех коллекций
    for (const collectionName of cardCollections) {
      const cardsRef = collection(db, collectionName);
      const q = query(cardsRef, where('userId', '==', auth.currentUser?.uid));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(doc => {
        const cardData = doc.data();
        cards.push({
          ...cardData,
          id: doc.id,
          collection: collectionName
        });
      });
    }
    
    userCards.value = cards;
    
    // Выбираем первую карту по умолчанию
    if (cards.length > 0) {
      selectedCard.value = cards[0];
    }
  } catch (err) {
    console.error('Ошибка загрузки карт:', err);
    error.value = 'Ошибка загрузки данных карт';
  }
};

const transferMoney = async () => {
  error.value = '';
  success.value = '';
  isLoading.value = true;

  try {
    if (!cardNumber.value || !amount.value) {
      throw new Error('Пожалуйста, заполните все поля');
    }

    const amountNum = parseFloat(amount.value);
    if (isNaN(amountNum)) {
      throw new Error('Введите корректную сумму');
    }
    
    if (amountNum <= 0) {
      throw new Error('Сумма должна быть больше нуля');
    }

    if (!selectedCard.value) {
      throw new Error('Карта отправителя не выбрана');
    }

    const cleanCardNumber = cardNumber.value.replace(/\D/g, '');
    
    // Ищем карту получателя во всех коллекциях
    let recipientCard = null;
    let recipientCardRef = null;
    let recipientCollection = '';
    
    for (const collectionName of cardCollections) {
      const cardsRef = collection(db, collectionName);
      const cardsSnapshot = await getDocs(cardsRef);
      
      cardsSnapshot.forEach(doc => {
        const cardData = doc.data();
        const dbCardNumber = cardData.cardNumber?.replace(/\D/g, '') || '';
        if (dbCardNumber === cleanCardNumber) {
          recipientCard = cardData;
          recipientCardRef = doc.ref;
          recipientCollection = collectionName;
        }
      });
      
      if (recipientCard) break;
    }

    if (!recipientCard) {
      throw new Error('Карта получателя не найдена. Проверьте номер карты');
    }

    if (recipientCard.cardNumber?.replace(/\D/g, '') === selectedCard.value.cardNumber?.replace(/\D/g, '')) {
      throw new Error('Нельзя перевести деньги на ту же карту');
    }

    if (selectedCard.value.balance < amountNum) {
      throw new Error('Недостаточно средств на карте');
    }

    await runTransaction(db, async (transaction) => {
      // Обновляем баланс карты отправителя
      transaction.update(doc(db, selectedCard.value.collection, selectedCard.value.id), {
        balance: selectedCard.value.balance - amountNum,
        expense: (selectedCard.value.expense || 0) + amountNum
      });

      // Обновляем баланс карты получателя
      transaction.update(doc(db, recipientCollection, recipientCardRef.id), {
        balance: recipientCard.balance + amountNum,
        income: (recipientCard.income || 0) + amountNum
      });

      // Получаем данные пользователей
      const senderUserRef = doc(db, 'users', auth.currentUser.uid);
      const senderUserSnap = await getDoc(senderUserRef);
      const senderUserData = senderUserSnap.data();
      
      const recipientUserRef = doc(db, 'users', recipientCard.userId);
      const recipientUserSnap = await getDoc(recipientUserRef);
      const recipientUserData = recipientUserSnap.data();

      // Функция для форматирования номера карты
      const formatCardForHistory = (cardNum) => {
        const cleanNum = cardNum.replace(/\D/g, '');
        const last8 = cleanNum.slice(-8);
        return `**** ${last8.slice(4)}`;
      };

      // Создаем записи в истории
      const historyRef = collection(db, 'history');
      
      // Запись для отправителя
      transaction.set(doc(historyRef), {
        type: 'transfer',
        amount: amountNum,
        cardNumber: formatCardForHistory(recipientCard.cardNumber),
        date: new Date(),
        userId: auth.currentUser.uid,
        userName: `${recipientUserData.firstName} ${recipientUserData.lastName}`,
        status: 'completed',
        direction: 'outgoing',
        currency: '$',
        fromCollection: selectedCard.value.collection,
        toCollection: recipientCollection
      });

      // Запись для получателя
      transaction.set(doc(historyRef), {
        type: 'transfer',
        amount: amountNum,
        cardNumber: formatCardForHistory(selectedCard.value.cardNumber),
        date: new Date(),
        userId: recipientCard.userId,
        userName: `${senderUserData.firstName} ${senderUserData.lastName}`,
        status: 'completed',
        direction: 'incoming',
        currency: '$',
        fromCollection: selectedCard.value.collection,
        toCollection: recipientCollection
      });

      // Создаем транзакции
      const transactionsRef = collection(db, 'transactions');
      transaction.set(doc(transactionsRef), {
        type: 'outgoing',
        amount: amountNum,
        fromCard: selectedCard.value.cardNumber,
        fromCollection: selectedCard.value.collection,
        toCard: recipientCard.cardNumber,
        toCollection: recipientCollection,
        toUser: recipientCard.userId,
        date: new Date(),
        userId: auth.currentUser.uid,
        status: 'completed'
      });

      transaction.set(doc(transactionsRef), {
        type: 'incoming',
        amount: amountNum,
        fromCard: selectedCard.value.cardNumber,
        fromCollection: selectedCard.value.collection,
        fromUser: auth.currentUser.uid,
        toCard: recipientCard.cardNumber,
        toCollection: recipientCollection,
        date: new Date(),
        userId: recipientCard.userId,
        status: 'completed'
      });
    });

    await loadUserCards();

    success.value = `Успешно переведено ${amountNum.toFixed(2)} $ на карту ${recipientCard.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}`;
    cardNumber.value = '';
    amount.value = '';
  } catch (err) {
    error.value = err.message;
    console.error('Ошибка перевода:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (auth.currentUser) {
    loadUserCards();
  } else {
    error.value = 'Пользователь не авторизован';
  }
});
</script>

<template>
  <main class="transferMoney">
    <div class="transferMoney__content" @click="openModal">
      <div class="transferMoney__content__image">
        <img src="../../../public/total/transferMoney.svg" alt="Transfer money">
      </div>
      <div class="transferMoney__content__text">
        <h1>Перевести деньги -</h1>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <button class="modal-close" @click="closeModal">×</button>
        <div class="transfer-form">
          <h2>Перевод денег</h2>
          
          <div v-if="userCards.length > 0" class="form-group">
            <label>Выберите карту для перевода:</label>
            <select v-model="selectedCard" class="card-select">
              <option 
                v-for="card in userCards" 
                :key="card.id" 
                :value="card"
              >
                {{ card.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') }} ({{ card.type }}) - {{ card.balance.toFixed(2) }} $
              </option>
            </select>
          </div>
          
          <div v-if="selectedCard" class="user-card-info">
            <h3>Выбранная карта</h3>
            <p>{{ selectedCard.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') }}</p>
            <p>Тип: {{ selectedCard.type }}</p>
            <p>Баланс: {{ selectedCard.balance.toFixed(2) }} $</p>
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>
          
          <div class="form-group">
            <label>Номер карты получателя:</label>
            <input 
              v-model="cardNumber" 
              type="text" 
              placeholder="0000 0000 0000 0000"
              @input="formatCardNumberInput"
              maxlength="19"
            >
          </div>
          
          <div class="form-group">
            <label>Сумма перевода ($):</label>
            <input 
              v-model="amount" 
              type="number" 
              placeholder="100" 
              min="1"
              :max="selectedCard ? selectedCard.balance : 0"
            >
          </div>
          
          <button 
            @click="transferMoney" 
            :disabled="isLoading || !selectedCard"
            class="transfer-button"
          >
            <span v-if="isLoading">Выполняется перевод...</span>
            <span v-else>Перевести деньги</span>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import "./transferMoney.scss";

.card-select {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.user-card-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-card-info h3 {
  margin-top: 0;
  color: #333;
}

.user-card-info p {
  margin: 5px 0;
  color: #555;
}
</style>