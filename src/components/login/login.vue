<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const loading = ref(false)

const handleLogin = async () => {
  error.value = '' // Сбрасываем ошибку перед попыткой входа
  loading.value = true // Активируем состояние загрузки
  
  try {
    // Проверяем, что email содержит @ (базовая валидация)
    if (!email.value.includes('@')) {
      throw new Error('Введите корректный email адрес')
    }
    
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/index') // Перенаправляем после успешного входа
  } catch (err) {
    console.error('Ошибка входа:', err)
    
    // Более понятные сообщения об ошибках для пользователя
    switch (err.code) {
      case 'auth/invalid-email':
        error.value = 'Неверный формат email'
        break
      case 'auth/user-disabled':
        error.value = 'Аккаунт заблокирован'
        break
      case 'auth/user-not-found':
        error.value = 'Пользователь с таким email не найден'
        break
      case 'auth/wrong-password':
        error.value = 'Неверный пароль'
        break
      case 'auth/too-many-requests':
        error.value = 'Слишком много попыток. Попробуйте позже'
        break
      default:
        error.value = err.message || 'Ошибка при входе. Попробуйте снова'
    }
  } finally {
    loading.value = false // Выключаем состояние загрузки в любом случае
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>Вход в систему</h1>
    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="form-group">
        <label>Email</label>
        <input 
          v-model="email" 
          type="email" 
          placeholder="Введите ваш email" 
          required
          autocomplete="username"
          :disabled="loading"
        >
      </div>
      
      <div class="form-group">
        <label>Пароль</label>
        <input 
          v-model="password" 
          type="password" 
          placeholder="Введите пароль" 
          required
          autocomplete="current-password"
          :disabled="loading"
        >
      </div>
      
      <button 
        type="submit" 
        class="auth-button"
        :disabled="loading"
      >
        <span v-if="loading">Загрузка...</span>
        <span v-else>Войти</span>
      </button>
      
      <div class="auth-links">
        <p class="auth-link">
          Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
        </p>
      </div>
      
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>
<style scoped>
@import "./login.scss";
</style>