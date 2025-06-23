<script setup>
import { ref, computed } from 'vue'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { useRouter } from 'vue-router'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const firstName = ref('') // Имя
const lastName = ref('') // Фамилия
const middleName = ref('') // Отчество
const username = ref('')
const dob = ref('')
const loading = ref(false)
const error = ref('')

// Вычисляем возраст на основе даты рождения
const age = computed(() => {
  if (!dob.value) return 0
  const birthDate = new Date(dob.value)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
})

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

const handleRegister = async () => {
  try {
    // Валидация
    if (password.value !== confirmPassword.value) {
      throw new Error('Пароли не совпадают')
    }
    
    if (age.value < 18) {
      throw new Error('Регистрация доступна только с 18 лет')
    }
    
    if (!firstName.value || !lastName.value) {
      throw new Error('Имя и фамилия обязательны')
    }

    loading.value = true
    error.value = ''
    
    // 1. Создаем пользователя в Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email.value, 
      password.value
    ).catch(err => {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Этот email уже используется')
      }
      throw err
    })
    
    // 2. Обновляем профиль пользователя
    await updateProfile(userCredential.user, {
      displayName: `${lastName.value} ${firstName.value} ${middleName.value}`.trim()
    })
    
    // 3. Создаем документ пользователя в коллекции users
    const userData = {
      uid: userCredential.user.uid,
      email: email.value,
      firstName: firstName.value,
      lastName: lastName.value,
      middleName: middleName.value,
      username: username.value,
      dob: dob.value,
      age: age.value,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    }
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData)
    
    // 4. Создаем карту в коллекции cards
    const cardHolderName = `${transliterate(lastName.value)} ${transliterate(firstName.value)}`.toUpperCase()
    
    const cardData = {
      cardNumber: generateCardNumber(),
      cardHolder: cardHolderName,
      validThru: generateValidThru(),
      balance: 100,
      expense: null,
      income: null,
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      userId: userCredential.user.uid,
      createdAt: serverTimestamp(),
      isActive: true,
      type: "Дебетовая"
    }
    
    await setDoc(doc(db, 'cards', userCredential.user.uid), cardData)
    
    // 5. Перенаправляем
    router.push('/index')
    
  } catch (err) {
    error.value = err.message || 'Ошибка регистрации'
    console.error('Ошибка регистрации', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>Регистрация</h1>
    <form @submit.prevent="handleRegister" class="auth-form">
      <div class="form-row">
        <div class="form-group">
          <label>Фамилия*</label>
          <input 
            v-model="lastName" 
            type="text" 
            placeholder="Иванов" 
            required
            minlength="2"
          >
        </div>
        
        <div class="form-group">
          <label>Имя*</label>
          <input 
            v-model="firstName" 
            type="text" 
            placeholder="Иван" 
            required
            minlength="2"
          >
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Отчество</label>
          <input 
            v-model="middleName" 
            type="text" 
            placeholder="Иванович" 
          >
        </div>
        
        <div class="form-group">
          <label>Email*</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="example@mail.com" 
            required
          >
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Дата рождения*</label>
          <input 
            v-model="dob" 
            type="date" 
            required
            :max="new Date().toISOString().split('T')[0]"
          >
          <small v-if="dob && age < 18" class="error-text">
            Регистрация доступна только с 18 лет
          </small>
        </div>
        
        <div class="form-group">
          <label>Логин*</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="ivanov123" 
            required
            minlength="4"
          >
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Пароль* (мин. 8 символов)</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required
            minlength="8"
          >
        </div>
        
        <div class="form-group">
          <label>Повторите пароль*</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="••••••••" 
            required
          >
        </div>
      </div>
      
      <button 
        type="submit" 
        class="auth-button" 
        :disabled="loading || age < 18"
      >
        {{ loading ? 'Загрузка...' : 'Зарегистрироваться' }}
      </button>
      
      <p class="auth-link">
        Уже есть аккаунт? <router-link to="/login">Войти</router-link>
      </p>
      
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
@import "./register.scss";
</style>