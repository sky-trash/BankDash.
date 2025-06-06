<template>
  <div class="auth-container">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="form-group">
        <label>Login</label>
        <input 
          v-model="username" 
          type="text" 
          placeholder="Enter Username" 
          required
        >
      </div>
      
      <div class="form-group">
        <label>Пароль</label>
        <input 
          v-model="password" 
          type="password" 
          placeholder="Enter password" 
          required
        >
      </div>
      
      <button type="submit" class="auth-button">Login</button>
      
      <p class="auth-link">
        Еще нету аккаунта <router-link to="/register">SignUp</router-link>
      </p>
      
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  try {
    // В реальном приложении нужно преобразовать username в email или использовать другую аутентификацию
    const email = `${username.value}@yourdomain.com` // Пример преобразования
    await signInWithEmailAndPassword(auth, email, password.value)
    router.push('/index')
  } catch (err) {
    error.value = 'Invalid username or password'
    console.error(err)
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background: white;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.auth-button {
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.auth-button:hover {
  background-color: #45a049;
}

.auth-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.auth-link a {
  color: #4CAF50;
  text-decoration: none;
}

.error-message {
  color: #f44336;
  text-align: center;
  margin-top: 1rem;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}
</style>