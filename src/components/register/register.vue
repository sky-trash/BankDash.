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
      
      <button type="submit" class="auth-button">Зарегистрироваться</button>
      
      <p class="auth-link">
        Уже есть аккаунт? <router-link to="/login">Войдите</router-link>
      </p>
      
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
.auth-container {
  max-width: 800px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  width: 100%;
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
  margin-top: 1rem;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .auth-container {
    padding: 1rem;
    margin: 1rem;
  }
}
</style>