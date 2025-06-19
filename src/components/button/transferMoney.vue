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
const currentUserCard = ref(null);

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

const loadUserCard = async () => {
  try {
    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('userId', '==', auth.currentUser?.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      currentUserCard.value = querySnapshot.docs[0].data();
      currentUserCard.value.id = querySnapshot.docs[0].id;
    }
  } catch (err) {
    console.error('Ошибка загрузки карты:', err);
    error.value = 'Ошибка загрузки данных карты';
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
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Введите корректную сумму');
    }

    if (!currentUserCard.value) {
      throw new Error('Ваша карта не найдена');
    }

    const cleanCardNumber = cardNumber.value.replace(/\D/g, '');

    const cardsRef = collection(db, 'cards');
    const cardsSnapshot = await getDocs(cardsRef);
    
    let recipientCard = null;
    let recipientCardRef = null;
    
    cardsSnapshot.forEach(doc => {
      const cardData = doc.data();
      const dbCardNumber = cardData.cardNumber?.replace(/\D/g, '') || '';
      if (dbCardNumber === cleanCardNumber) {
        recipientCard = cardData;
        recipientCardRef = doc.ref;
      }
    });

    if (!recipientCard) {
      throw new Error('Карта получателя не найдена. Проверьте номер карты');
    }

    if (recipientCard.cardNumber?.replace(/\D/g, '') === currentUserCard.value.cardNumber?.replace(/\D/g, '')) {
      throw new Error('Нельзя перевести деньги на ту же карту');
    }

    if (currentUserCard.value.balance < amountNum) {
      throw new Error('Недостаточно средств на карте');
    }

    await runTransaction(db, async (transaction) => {
      // Обновляем балансы карт
      transaction.update(doc(db, 'cards', currentUserCard.value.id), {
        balance: currentUserCard.value.balance - amountNum,
        expense: (currentUserCard.value.expense || 0) + amountNum
      });

      transaction.update(recipientCardRef, {
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
        currency: '$'
      });

      // Запись для получателя
      transaction.set(doc(historyRef), {
        type: 'transfer',
        amount: amountNum,
        cardNumber: formatCardForHistory(currentUserCard.value.cardNumber),
        date: new Date(),
        userId: recipientCard.userId,
        userName: `${senderUserData.firstName} ${senderUserData.lastName}`,
        status: 'completed',
        direction: 'incoming',
        currency: '$'
      });

      // Создаем транзакции
      const transactionsRef = collection(db, 'transactions');
      transaction.set(doc(transactionsRef), {
        type: 'outgoing',
        amount: amountNum,
        fromCard: currentUserCard.value.cardNumber,
        toCard: recipientCard.cardNumber,
        toUser: recipientCard.userId,
        date: new Date(),
        userId: auth.currentUser.uid,
        status: 'completed'
      });

      transaction.set(doc(transactionsRef), {
        type: 'incoming',
        amount: amountNum,
        fromCard: currentUserCard.value.cardNumber,
        fromUser: auth.currentUser.uid,
        toCard: recipientCard.cardNumber,
        date: new Date(),
        userId: recipientCard.userId,
        status: 'completed'
      });
    });

    await loadUserCard();

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
    loadUserCard();
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
          
          <div v-if="currentUserCard" class="user-card-info">
            <h3>Ваша карта</h3>
            <p>{{ currentUserCard.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') }}</p>
            <p>Баланс: {{ currentUserCard.balance.toFixed(2) }} $</p>
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
              :max="currentUserCard ? currentUserCard.balance : 0"
            >
          </div>
          
          <button 
            @click="transferMoney" 
            :disabled="isLoading || !currentUserCard"
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
</style>