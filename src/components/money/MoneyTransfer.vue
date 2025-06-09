<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  runTransaction 
} from 'firebase/firestore';

const cardNumber = ref('');
const amount = ref('');
const error = ref('');
const success = ref('');
const isLoading = ref(false);
const currentUserCard = ref(null);

// const auth = getAuth();

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
      console.log('Текущая карта:', currentUserCard.value);
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
    // Валидация
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

    // Нормализация номера карты
    const cleanCardNumber = cardNumber.value.replace(/\D/g, '');
    console.log('Ищем карту:', cleanCardNumber);

    // Получаем все карты
    const cardsRef = collection(db, 'cards');
    const cardsSnapshot = await getDocs(cardsRef);
    
    // Ищем карту получателя
    let recipientCard = null;
    let recipientCardRef = null;
    
    cardsSnapshot.forEach(doc => {
      const cardData = doc.data();
      const dbCardNumber = cardData.cardNumber?.replace(/\D/g, '') || '';
      console.log('Карта в базе:', dbCardNumber, 'Ищем:', cleanCardNumber);
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

    // Выполнение транзакции
    await runTransaction(db, async (transaction) => {
      // Списание с отправителя
      transaction.update(doc(db, 'cards', currentUserCard.value.id), {
        balance: currentUserCard.value.balance - amountNum,
        expense: (currentUserCard.value.expense || 0) + amountNum
      });

      // Зачисление получателю
      transaction.update(recipientCardRef, {
        balance: recipientCard.balance + amountNum,
        income: (recipientCard.income || 0) + amountNum
      });

      // Запись транзакции у отправителя
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

      // Запись транзакции у получателя
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

    // Обновляем данные карты после перевода
    await loadUserCard();

    success.value = `Успешно переведено ${amountNum.toFixed(2)} ₽ на карту ${recipientCard.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}`;
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
  <div class="transfer-form">
    <h2>Перевод денег</h2>
    
    <div v-if="currentUserCard" class="user-card-info">
      <h3>Ваша карта</h3>
      <p>{{ currentUserCard.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') }}</p>
      <p>Баланс: {{ currentUserCard.balance.toFixed(2) }} ₽</p>
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
      <label>Сумма перевода (₽):</label>
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
</template>

<style scoped>
.transfer-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 25px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-card-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-card-info h3 {
  margin-top: 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #42b983;
  outline: none;
}

.transfer-button {
  width: 100%;
  padding: 14px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.transfer-button:hover:not(:disabled) {
  background-color: #3aa876;
}

.transfer-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  padding: 12px;
  background-color: #fdecea;
  border-radius: 6px;
  margin-bottom: 20px;
}

.success-message {
  color: #2ecc71;
  padding: 12px;
  background-color: #e8f8f0;
  border-radius: 6px;
  margin-bottom: 20px;
}
</style>