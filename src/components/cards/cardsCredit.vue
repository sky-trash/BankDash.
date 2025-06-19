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
      type: "Кредитная",
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
    
    <div class="cardsCredit__button" v-if="showGetCreditButton" @click="showModal = true">
      <div class="cardsCredit__button__image">
        <img src="../../../public/total/transferMoney.svg" alt="Transfer money">
      </div>
      <div class="cardsCredit__button__text">
        <h1>Заявка на кредит +</h1>
      </div>
    </div>
    
    <div class="cardsCredit__modal" v-if="showModal" @click.self="showModal = false">
      <div class="cardsCredit__modal__content">
        <div class="cardsCredit__modal__content__header">
          <h1>Заявка на кредит</h1>
          <span class="close" @click="showModal = false">×</span>
        </div>

        <div class="form-group">
          <label>Имя:</label>
          <input 
            v-model="firstName" 
            type="text" 
            placeholder="Иван" 
            required
            minlength="2"
          >
        </div>

        <div class="form-group">
          <label>Фамилия:</label>
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
          <input 
            type="number" 
            v-model.number="creditAmount" 
            min="100" 
            max="1000000" 
            placeholder="До 1,000,000 $"
            required
            @input="creditAmount = Math.min(1000000, Math.max(0, creditAmount))"
          >
          <small v-if="creditAmount > 1000000 || creditAmount < 0" class="error-text">
            Сумма кредита должна быть от 0 до 1,000,000 $
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
</style>