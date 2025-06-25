<script setup lang="ts">
import Header from '../layout/header/header.vue'
import Dash from '../layout/dash/dash.vue'
import { ref, onMounted, nextTick } from 'vue'
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
  currentPassword: string
  newPassword: string
  dob: string
  placeBirth: string
  permanentAddress: string
  city: string
  postalCode: string
  country: string
  phoneNumber: string
}

interface Tab {
  id: string
  label: string
}

const activeTab = ref<string>('profile')
const tabs = ref<Tab[]>([
  { id: 'profile', label: 'Настройки профиля' },
])

const profileData = ref<ProfileData>({
  firstName: '',
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  dob: '',
  placeBirth: '',
  permanentAddress: '',
  city: '',
  postalCode: '',
  country: 'Russia',
  phoneNumber: ''
})

const showPassword = ref<boolean>(false)
const isSaving = ref<boolean>(false)
const currentUser = ref<User | null>(null)
const showReauthModal = ref<boolean>(false)
const reauthPassword = ref<string>('')
const errorMessage = ref<string>('')
const formattedPhoneNumber = ref('')

// Загрузка профиля
onMounted(async () => {
  try {
    currentUser.value = auth.currentUser
    if (currentUser.value) {
      await loadUserProfile()
    }
  } catch (error) {
    console.error('Initialization error:', error)
    errorMessage.value = 'Ошибка загрузки профиля'
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
        ...profileData.value,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        middleName: userData.middleName || '',
        username: userData.username || '',
        email: currentUser.value.email || '',
        dob: userData.dob || '',
        placeBirth: userData.placeBirth || '',
        permanentAddress: userData.permanentAddress || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        country: userData.country || 'Russia',
        phoneNumber: userData.phoneNumber || ''
      }

      // Форматируем номер телефона при загрузке для отображения
      if (profileData.value.phoneNumber) {
        const digits = profileData.value.phoneNumber.replace(/\D/g, '')
        if (digits.length > 0) {
          let formatted = digits[0]
          if (digits.length > 1) formatted += ' ' + digits.substring(1, 4)
          if (digits.length > 4) formatted += ' ' + digits.substring(4, 7)
          if (digits.length > 7) formatted += ' ' + digits.substring(7, 9)
          if (digits.length > 9) formatted += ' ' + digits.substring(9, 11)
          formattedPhoneNumber.value = formatted
        }
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    errorMessage.value = 'Ошибка загрузки данных профиля'
  }
}

const formatPhoneNumber = (e: Event) => {
  const target = e.target as HTMLInputElement
  const originalCursorPos = target.selectionStart || 0
  const originalValue = target.value

  // Получаем только цифры из введенного значения
  const digitsOnly = target.value.replace(/\D/g, '')

  // Сохраняем только цифры (без пробелов) в хранилище
  profileData.value.phoneNumber = digitsOnly.length > 11 ? digitsOnly.substring(0, 11) : digitsOnly

  // Форматируем для отображения
  let formattedValue = ''
  if (digitsOnly.length > 0) {
    formattedValue = digitsOnly[0]
    if (digitsOnly.length > 1) formattedValue += ' ' + digitsOnly.substring(1, 4)
    if (digitsOnly.length > 4) formattedValue += ' ' + digitsOnly.substring(4, 7)
    if (digitsOnly.length > 7) formattedValue += ' ' + digitsOnly.substring(7, 9)
    if (digitsOnly.length > 9) formattedValue += ' ' + digitsOnly.substring(9, 11)
  }

  // Обновляем отображаемое значение
  formattedPhoneNumber.value = formattedValue

  // Корректируем позицию курсора
  nextTick(() => {
    let newCursorPos = originalCursorPos

    // Если добавляем цифру
    if (formattedValue.length > originalValue.length) {
      // Пропускаем позиции пробелов
      if (formattedValue[newCursorPos] === ' ') {
        newCursorPos++
      }
    }
    // Если удаляем цифру
    else if (formattedValue.length < originalValue.length) {
      // Если удалили пробел, перемещаем курсор назад
      if (originalValue[originalCursorPos - 1] === ' ') {
        newCursorPos--
      }
    }

    // Ограничиваем позицию курсора
    newCursorPos = Math.min(newCursorPos, formattedValue.length)

    target.setSelectionRange(newCursorPos, newCursorPos)
  })
}

const handleBackspace = (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement
  const cursorPos = target.selectionStart || 0

  // Если перед курсором пробел, пропускаем его
  if (target.value[cursorPos - 1] === ' ') {
    e.preventDefault()
    target.setSelectionRange(cursorPos - 1, cursorPos - 1)
    target.dispatchEvent(new Event('input'))
  }
}

const handleReauthentication = async () => {
  try {
    if (!currentUser.value || !currentUser.value.email) {
      throw new Error('Пользователь не авторизован')
    }

    const credential = EmailAuthProvider.credential(
      currentUser.value.email,
      reauthPassword.value
    )

    await reauthenticateWithCredential(currentUser.value, credential)
    showReauthModal.value = false
    reauthPassword.value = ''
    await saveProfileChanges()
  } catch (error) {
    console.error('Reauthentication failed:', error)
    errorMessage.value = 'Неверный пароль. Пожалуйста, попробуйте снова.'
  }
}

const saveProfileChanges = async () => {
  try {
    if (!currentUser.value) throw new Error('Пользователь не авторизован')

    // Номер уже сохранен без пробелов в profileData.phoneNumber
    const userRef = doc(db, 'users', currentUser.value.uid)
    await setDoc(userRef, {
      firstName: profileData.value.firstName,
      lastName: profileData.value.lastName,
      middleName: profileData.value.middleName,
      username: profileData.value.username,
      dob: profileData.value.dob,
      placeBirth: profileData.value.placeBirth,
      permanentAddress: profileData.value.permanentAddress,
      city: profileData.value.city,
      postalCode: profileData.value.postalCode,
      country: profileData.value.country,
      phoneNumber: profileData.value.phoneNumber,
      lastUpdated: new Date()
    }, { merge: true })

    // Обновляем email если он изменился
    if (profileData.value.email !== currentUser.value.email) {
      await updateEmail(currentUser.value, profileData.value.email)
    }

    alert('Профиль успешно обновлен!')
  } catch (error) {
    console.error('Error updating profile:', error)
    if ((error as any).code === 'auth/requires-recent-login') {
      throw error
    }
    errorMessage.value = 'Ошибка обновления профиля: ' + (error as Error).message
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
    }
  } finally {
    isSaving.value = false
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
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
                  <small>Изменить нельзя</small>
                </div>
                <div class="form-group" id="form-group-disable">
                  <h1>Пароль:</h1>
                  <input :type="showPassword ? 'text' : 'password'" placeholder="********" disabled>
                  <small>Изменить нельзя</small>
                </div>
                <div class="form-group">
                  <h1>Место рождения:</h1>
                  <input v-model="profileData.placeBirth" type="text">
                </div>
                <div class="form-group">
                  <h1>Адрес проживания:</h1>
                  <input v-model="profileData.permanentAddress" type="text">
                </div>
                <div class="form-group">
                  <h1>Город:</h1>
                  <input v-model="profileData.city" type="text">
                </div>
                <div class="form-group">
                  <h1>Почтовый индекс:</h1>
                  <input v-model="profileData.postalCode" type="text" maxlength="6" minlength="6">
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
                <div class="form-group">
                  <h1>Номер телефона:</h1>
                  <input v-model="formattedPhoneNumber" @input="formatPhoneNumber" @keydown.delete="handleBackspace"
                    type="tel" placeholder="8 XXX XXX XX XX" maxlength="15" ref="phoneInput">
                </div>
              </div>
              <div class="settingsProfile__edit__content__button">
                <button type="submit" :disabled="isSaving">
                  <h1>{{ isSaving ? 'Сохранение...' : 'Сохранить' }}</h1>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно повторной аутентификации -->
    <div v-if="showReauthModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Требуется подтверждение</h3>
        <p>Для изменения важных данных введите ваш текущий пароль:</p>

        <input v-model="reauthPassword" type="password" placeholder="Текущий пароль">

        <div class="modal-actions">
          <button @click="showReauthModal = false">
            Отмена
          </button>
          <button @click="handleReauthentication">
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