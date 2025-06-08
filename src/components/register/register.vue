<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { useRouter } from 'vue-router'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const fullName = ref('')
const email = ref('')
const dob = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const router = useRouter()
const loading = ref(false)

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают'
    return
  }

  try {
    // 1. Создаем пользователя в Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email.value, 
      password.value
    )
    
    // 2. Получаем созданного пользователя
    const user = userCredential.user
    
    // 3. Сохраняем дополнительные данные в Firestore
    await setDoc(doc(db, 'users', user.uid), {
      fullName: fullName.value,
      email: email.value,
      dob: dob.value,
      username: username.value,
      createdAt: new Date()
    })
    
    // 4. Перенаправляем на главную
    router.push('/index')
  } catch (err) {
    error.value = 'Ошибка регистрации: ' + err.message
    console.error(err)
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>Регистрация</h1>
    <form @submit.prevent="handleRegister" class="auth-form">
      <div class="form-row">
        <div class="form-group">
          <label>Имя</label>
          <input 
            v-model="fullName" 
            type="text" 
            placeholder="Введите полное имя" 
            required
          >
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="Введите ваш email" 
            required
          >
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Дата рождения</label>
          <input 
            v-model="dob" 
            type="date" 
            placeholder="ДД.ММ.ГГГГ" 
            required
          >
        </div>
        
        <div class="form-group">
          <label>Логин</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Введите логин" 
            required
          >
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Пароль</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Введите пароль" 
            required
          >
        </div>
        
        <div class="form-group">
          <label>Повторите пароль</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Повторите пароль" 
            required
          >
        </div>
      </div>
      
      <button type="submit" class="auth-button">{{ loading ? 'Загрузка...' : 'Зарегистрироваться' }}</button>
      
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