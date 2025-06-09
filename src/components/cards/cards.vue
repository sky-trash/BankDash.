<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase' // Убедитесь, что путь правильный

interface CardData {
  cardNumber: string
  cardHolder: string
  validThru: string
  balance: number
  cvv: string
  userId: string
  createdAt: string
  isActive: boolean
}

const cardData = ref<CardData | null>(null)
const loading = ref(true)
const error = ref('')

const fetchCardData = async () => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Пользователь не авторизован')
    }

    const docRef = doc(db, 'cards', user.uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      cardData.value = docSnap.data() as CardData
    } else {
      throw new Error('Данные карты не найдены')
    }
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки данных карты'
    console.error('Error fetching card data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCardData()
})
</script>
<template>
  <main class="cards">
    <div class="cards__all">
      <h1>Мои карты</h1>
    </div>
    
    <div v-if="loading" class="loading">Загрузка данных карты...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="cardData" class="cards__card">
      <div class="cards__card__chip">
        <div class="cards__card__chip__balanse">
          <p>Баланс</p>
          <h1>${{ cardData.balance }}</h1>
        </div>
        <div class="cards__card__chip__image">
          <img src="../../../public/cards/chip.svg" alt="Чип карты">
        </div>
      </div>
      
      <div class="cards__card__castom">
        <div class="cards__card__castom__holder">
          <p>Card Holder</p>
          <h1>{{ cardData.cardHolder }}</h1>
        </div>
        <div class="cards__card__castom__volid">
          <p>Valid THRU</p>
          <h1>{{ cardData.validThru }}</h1>
        </div>
      </div>
      
      <div class="cards__card__number">
        <div class="cards__card__number__text">
          <p>{{ cardData.cardNumber }}</p>
        </div>
        <div class="cards__card__number__image">
          <img src="../../../public/cards/master.svg" alt="Mastercard">
        </div>
      </div>
    </div>
    
    <div v-else class="no-card">
      <p>У вас пока нет карты</p>
    </div>
  </main>
</template>
<style scoped lang="scss">
@import './cards.scss';

.loading, .error, .no-card {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}
</style>