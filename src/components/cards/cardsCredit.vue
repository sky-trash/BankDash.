<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/firebase'
import { useRouter } from 'vue-router'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const router = useRouter()
const auth = getAuth()
const firstName = ref('')
const lastName = ref('')
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const creditAmount = ref(0)
const monthlyIncome = ref(0)
const companyName = ref('')
const showGetCreditButton = ref(true)
const cardData = ref(null)

// Загружаем данные карты при монтировании компонента
onMounted(() => {
  checkAuthAndLoadCard()
})

const checkAuthAndLoadCard = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await loadCardData(user.uid)
    }
  })
}

const loadCardData = async (userId) => {
  try {
    const docRef = doc(db, 'credit', userId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      cardData.value = docSnap.data()
      showGetCreditButton.value = false
    } else {
      showGetCreditButton.value = true
    }
  } catch (err) {
    console.error('Ошибка загрузки данных карты:', err)
  }
}

const generateCardNumber = () => {
  let cardNumber = ''
  for (let i = 0; i < 16; i++) {
    cardNumber += Math.floor(Math.random() * 10)
    if ((i + 1) % 4 === 0 && i !== 15) cardNumber += ' '
  }
  return cardNumber
}

function transliterate(name) {
  if (!name) return ''
  const cyr = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  }
  
  return name.toLowerCase().split('').map(char => 
    cyr[char] || char
  ).join('')
}

const generateValidThru = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear() + 3).slice(-2)
  return `${month}/${year}`
}

const handleCredit = async () => {
  try {
    loading.value = true
    error.value = ''

    // Валидация полей
    if (!firstName.value || !lastName.value || !creditAmount.value || !monthlyIncome.value) {
      throw new Error('Пожалуйста, заполните все обязательные поля')
    }

    // Валидация суммы кредита
    if (creditAmount.value > 1000000) {
      throw new Error('Максимальная сумма кредита - 1,000,000 $')
    }

    if (creditAmount.value <= 0) {
      throw new Error('Сумма кредита должна быть больше 0')
    }

    // Валидация дохода
    if (monthlyIncome.value <= 0) {
      throw new Error('Доход должен быть больше 0')
    }

    const user = auth.currentUser
    if (!user) {
      throw new Error('Пользователь не авторизован')
    }

    // Создаем карту в коллекции cards
    const cardHolderName = `${transliterate(lastName.value)} ${transliterate(firstName.value)}`.toUpperCase()
    
    const newCardData = {
      cardNumber: generateCardNumber(),
      cardHolder: cardHolderName,
      validThru: generateValidThru(),
      balance: creditAmount.value,
      expense: null,
      income: null,
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      userId: user.uid,
      createdAt: serverTimestamp(),
      isActive: true,
      creditLimit: creditAmount.value,
      company: companyName.value
    }
    
    await setDoc(doc(db, 'credit', user.uid), newCardData)
    
    // Обновляем локальные данные
    cardData.value = newCardData
    showModal.value = false
    showGetCreditButton.value = false
    
  } catch (err) {
    error.value = err.message || 'Ошибка заявки'
    console.error('Ошибка заявки', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="cardsCredit">
    <div class="cardsCredit__all">
      <h1>Кредитная карта</h1>
    </div>
    
    <div class="cardsCredit__button" v-if="showGetCreditButton">
      <button @click="showModal = true">
        <h1>Получить кредит</h1>
      </button>
    </div>
    
    <div class="cardsCredit__modal" v-if="showModal">
      <div class="modal-content">
        <span class="close" @click="showModal = false">&times;</span>
        <h2>Заявка на кредит</h2>

        <div class="form-group">
          <label>Имя</label>
          <input 
            v-model="firstName" 
            type="text" 
            placeholder="Иван" 
            required
            minlength="2"
          >
        </div>

        <div class="form-group">
          <label>Фамилия</label>
          <input 
            v-model="lastName" 
            type="text" 
            placeholder="Иванов" 
            required
            minlength="2"
          >
        </div>

        <div class="form-group">
          <label>Сумма кредита ($):</label>
          <label>От 100 до 1,000,000$</label>
          <input 
            type="number" 
            v-model.number="creditAmount" 
            min="1" 
            max="1000000" 
            placeholder="До 1,000,000 $"
            required
            @input="creditAmount = Math.min(1000000, creditAmount)"
          >
          <small v-if="creditAmount > 1000000" class="error-text">
            Максимальная сумма кредита - 1,000,000 $
          </small>
        </div>
        
        <div class="form-group">
          <label>Заработок в месяц ($):</label>
          <input 
            type="number" 
            v-model.number="monthlyIncome" 
            min="1" 
            placeholder="Ваш доход"
            required
          >
        </div>
        
        <div class="form-group">
          <label>Компания:</label>
          <input 
            type="text" 
            v-model="companyName" 
            placeholder="Где вы работаете?"
          >
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <button class="submit-btn" @click="handleCredit" :disabled="loading">
          {{ loading ? 'Загрузка...' : 'Подать заявку' }}
        </button>
      </div>
    </div>
    
    <div class="cardsCredit__card" v-if="cardData">
      <div class="cardsCredit__card__chip">
        <div class="cardsCredit__card__chip__balanse">
          <p>Баланс</p>
          <h1>${{ cardData.balance }}</h1>
        </div>
        <div class="cardsCredit__card__chip__image">
          <img src="../../../public/cards/chip-silver.svg" alt="Чип карты">
        </div>
      </div>
      <div class="cardsCredit__card__castom">
        <div class="cardsCredit__card__castom__holder">
          <p>Card Holder</p>
          <h1>{{ cardData.cardHolder }}</h1>
        </div>
        <div class="cardsCredit__card__castom__volid">
          <p>Valid THRU</p>
          <h1>{{ cardData.validThru }}</h1>
        </div>
      </div>
      <div class="cardsCredit__card__number">
        <div class="cardsCredit__card__number__text">
          <p>{{ cardData.cardNumber }}</p>
        </div>
        <div class="cardsCredit__card__number__image">
          <img src="../../../public/cards/master-silver.svg" alt="Mastercard">
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped>
@import "./cardsCredit.scss";

.loading, .error, .no-card {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}

.cardsCredit__button button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 20px 0;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.cardsCredit__button button:hover {
  background-color: #45a049;
}

.cardsCredit__modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  margin-right: 10px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:hover {
  background-color: #45a049;
}

.cancel-btn:hover {
  background-color: #d32f2f;
}
</style>