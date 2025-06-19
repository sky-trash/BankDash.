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
  { id: 'profile', label: 'Edit Profile' },
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
    errorMessage.value = 'Failed to load profile data'
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
    await saveProfileChanges() // Proceed with the original save operation
  } catch (error) {
    console.error('Reauthentication failed:', error)
    errorMessage.value = 'Incorrect password. Please try again.'
  }
}

const saveProfileChanges = async () => {
  try {
    // Update profile data in Firestore
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

    // Update email if changed
    if (profileData.value.email !== currentUser.value!.email) {
      await updateEmail(currentUser.value!, profileData.value.email)
    }

    // Update password if changed
    if (profileData.value.password) {
      await updatePassword(currentUser.value!, profileData.value.password)
    }

    alert('Profile updated successfully!')
    profileData.value.password = '' // Clear password field after save
  } catch (error) {
    console.error('Error updating profile:', error)
    errorMessage.value = 'Failed to update profile: ' + (error as Error).message
    throw error // Re-throw to handle in parent function
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
      <div class="profile-edit">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id" 
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="activeTab === 'profile'" class="profile-content">
          <form @submit.prevent="saveProfile">
            <div class="form-grid">
              <div class="form-group">
                <label>Имя:</label>
                <input v-model="profileData.firstName" type="text">
              </div>

              <div class="form-group">
                <label>Фамилия:</label>
                <input v-model="profileData.lastName" type="text">
              </div>

              <div class="form-group">
                <label>Отчество:</label>
                <input v-model="profileData.middleName" type="text">
              </div>

              <div class="form-group">
                <label>Логин:</label>
                <input v-model="profileData.username" type="text">
              </div>

              <div class="form-group">
                <label>Email:</label>
                <input v-model="profileData.email" type="email" disabled>
              </div>

              <div class="form-group">
                <label>Пароль:</label>
                <div class="password-field">
                  <input 
                    v-model="profileData.password" 
                    :type="showPassword ? 'text' : 'password'" 
                    placeholder="********"
                  >
                  <button 
                    type="button" 
                    class="show-password" 
                    @click="togglePasswordVisibility"
                  >
                    {{ showPassword ? 'Скрыть' : 'Показать' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Дата рождения:</label>
                <input v-model="profileData.dob" type="date" disabled>
              </div>

              <div class="form-group">
                <label>Текущий адрес:</label>
                <input v-model="profileData.presentAddress" type="text">
              </div>

              <div class="form-group">
                <label>Постоянный адрес:</label>
                <input v-model="profileData.permanentAddress" type="text">
              </div>

              <div class="form-group">
                <label>Город:</label>
                <input v-model="profileData.city" type="text">
              </div>

              <div class="form-group">
                <label>Почтовый индекс:</label>
                <input v-model="profileData.postalCode" type="text">
              </div>

              <div class="form-group">
                <label>Страна:</label>
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

            <button type="submit" class="save-btn" :disabled="isSaving">
              {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Reauthentication Modal -->
    <div v-if="showReauthModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Требуется повторная аутентификация</h3>
        <p>Для изменения важных данных введите ваш текущий пароль:</p>
        
        <div class="form-group">
          <input 
            v-model="currentPassword" 
            type="password" 
            placeholder="Текущий пароль"
          >
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
  /* Ширина бокового меню */
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