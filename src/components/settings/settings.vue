<script setup lang="ts">
import Header from '../layout/header/header.vue'
import Dash from '../layout/dash/dash.vue'
import { ref, onMounted } from 'vue'
import { auth, db } from '@/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import type { User } from 'firebase/auth'

interface ProfileData {
  firstName: string
  lastName?: string
  middleName?: string
  username: string
  email: string
  password: string
  dob: string
  presentAddress: string
  permanentAddress: string
  city: string
  postalCode: string
  country: string
}

interface Tab {
  id: string
  label: string
}

const activeTab = ref<string>('profile')
const tabs = ref<Tab[]>([
  { id: 'profile', label: 'Настройки профиля' },
  { id: 'security', label: 'Безопасность' },
])

const profileData = ref<ProfileData>({
  firstName: '',
  username: '',
  email: '',
  password: '',
  dob: '',
  presentAddress: '',
  permanentAddress: '',
  city: '',
  postalCode: '',
  country: 'Russia'
})

const showPassword = ref<boolean>(false)
const isSaving = ref<boolean>(false)
const currentUser = ref<User | null>(null)
const showReauthModal = ref<boolean>(false)
const currentPassword = ref<string>('')
const errorMessage = ref<string>('')

onMounted(async () => {
  currentUser.value = auth.currentUser
  if (currentUser.value) {
    await loadUserProfile()
  }
})

const loadUserProfile = async () => {
  try {
    if (!currentUser.value) return

    const userRef = doc(db, 'users', currentUser.value.uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()
      profileData.value = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        middleName: userData.middleName || '',
        username: userData.username || '',
        email: currentUser.value.email || '',
        password: '',
        dob: userData.dob || '',
        presentAddress: userData.presentAddress || '',
        permanentAddress: userData.permanentAddress || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        country: userData.country || 'Russia'
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    errorMessage.value = 'Не удалось загрузить данные профиля'
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleReauthentication = async () => {
  try {
    if (!currentUser.value || !currentUser.value.email) return

    const credential = EmailAuthProvider.credential(
      currentUser.value.email,
      currentPassword.value
    )

    await reauthenticateWithCredential(currentUser.value, credential)
    showReauthModal.value = false
    currentPassword.value = ''
    await saveProfileChanges()
  } catch (error) {
    console.error('Reauthentication failed:', error)
    errorMessage.value = 'Неправильный пароль. Попробуйте еще раз.'
  }
}

const saveProfileChanges = async () => {
  try {
    const userRef = doc(db, 'users', currentUser.value!.uid)
    await setDoc(userRef, {
      firstName: profileData.value.firstName,
      lastName: profileData.value.lastName,
      middleName: profileData.value.middleName,
      username: profileData.value.username,
      dob: profileData.value.dob,
      presentAddress: profileData.value.presentAddress,
      permanentAddress: profileData.value.permanentAddress,
      city: profileData.value.city,
      postalCode: profileData.value.postalCode,
      country: profileData.value.country,
      lastUpdated: new Date()
    }, { merge: true })

    if (profileData.value.email !== currentUser.value!.email) {
      await updateEmail(currentUser.value!, profileData.value.email)
    }

    if (profileData.value.password) {
      await updatePassword(currentUser.value!, profileData.value.password)
    }

    alert('Profile updated successfully!')
    profileData.value.password = '' 
  } catch (error) {
    console.error('Error updating profile:', error)
    errorMessage.value = 'Не удалось обновить профиль: ' + (error as Error).message
    throw error 
  }
}

const saveProfile = async () => {
  if (!currentUser.value) return

  isSaving.value = true
  errorMessage.value = ''

  try {
    await saveProfileChanges()
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      showReauthModal.value = true
    } else {
      errorMessage.value = 'Error updating profile: ' + error.message
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <Dash />
    <div class="content-area">
      <Header />
      <div class="settingsProfile">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div class="settingsProfile__tabs">
          <div v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
            <h1>{{ tab.label }}</h1>
            <!-- <img src="../../../public/dash/Rectangle.svg" alt=""> -->
          </div>
        </div>
        <div class="settingsProfile__edit">
          <div v-if="activeTab === 'profile'" class="settingsProfile__edit__content">
            <form @submit.prevent="saveProfile">
              <div class="settingsProfile__edit__content__form">
                <div class="form-group">
                  <h1>Ваше имя:</h1>
                  <input v-model="profileData.firstName" type="text">
                </div>
                <div class="form-group">
                  <h1>Ваша фамилия:</h1>
                  <input v-model="profileData.lastName" type="text">
                </div>
                <div class="form-group">
                  <h1>Ваше отчество:</h1>
                  <input v-model="profileData.middleName" type="text">
                </div>
                <div class="form-group">
                  <h1>Логин:</h1>
                  <input v-model="profileData.username" type="text">
                </div>
                <div class="form-group" id="form-group-disable">
                  <h1>Email:</h1>
                  <input v-model="profileData.email" type="text" disabled>
                </div>
                <div class="form-group" id="form-group-disable">
                  <h1>Пароль:</h1>
                  <input v-model="profileData.password" :type="showPassword ? 'text' : 'password'"
                    placeholder="********" disabled>
                  <small>Можно изменить в в разделе "Безопасность"</small>
                </div>
                <div class="form-group">
                  <h1>Текущий адресс:</h1>
                  <input v-model="profileData.presentAddress" type="text">
                </div>
                <div class="form-group">
                  <h1>Постоянный адрес:</h1>
                  <input v-model="profileData.permanentAddress" type="text">
                </div>
                <div class="form-group">
                  <h1>Город:</h1>
                  <input v-model="profileData.city" type="text">
                </div>
                <div class="form-group">
                  <h1>Почтовый индекс:</h1>
                  <input v-model="profileData.postalCode" type="text">
                </div>
                <div class="form-group">
                  <h1>Страна:</h1>
                  <select v-model="profileData.country">
                    <option value="Russia">Россия</option>
                    <option value="USA">США</option>
                    <option value="UK">Великобритания</option>
                    <option value="Germany">Германия</option>
                    <option value="Spain">Испания</option>
                    <option value="Brasil">Бразилия</option>
                    <option value="China">Китай</option>
                    <option value="AU">Австралия</option>
                  </select>
                </div>
              </div>
              <div class="settingsProfile__edit__content__button">
                <button type="submit" :disabled="isSaving">
                  <h1>{{ isSaving ? 'Сохранение...' : 'Сохранить' }}</h1>
                </button>
              </div>
            </form>
          </div>
          <div v-if="activeTab === 'security'" class="settingsProfile__edit__content">
            <form @submit.prevent="saveProfile">
              <div class="form-grid">
                <div class="form-group">
                  <h1>Пароль:</h1>
                  <div class="password-field">
                    <input v-model="profileData.password" :type="showPassword ? 'text' : 'password'"
                      placeholder="********">
                    <button type="button" class="show-password" @click="togglePasswordVisibility">
                      {{ showPassword ? 'Скрыть' : 'Показать' }}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showReauthModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Требуется повторная аутентификация</h3>
        <p>Для изменения важных данных введите ваш текущий пароль:</p>

        <div class="form-group">
          <input v-model="currentPassword" type="password" placeholder="Текущий пароль">
        </div>

        <div class="modal-actions">
          <button @click="showReauthModal = false" class="cancel-btn">
            Отмена
          </button>
          <button @click="handleReauthentication" class="confirm-btn">
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.dash {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 249px;
  background: #fff;
  border-right: 1px solid #e6eff5;
  z-index: 10;
}

.content-area {
  flex: 1;
  margin-left: 249px;
}

.header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
<style scoped lang="scss">
@import './settings.scss';
</style>