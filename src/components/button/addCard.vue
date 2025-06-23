<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { db } from '@/firebase';
import { collection, addDoc, getDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const cardNumber = ref('');
const cardHolderRu = ref('');
const cardHolder = ref(''); // Для английской версии
const validThru = ref('');
const cvv = ref('');
const userData = ref<any>(null);
const hasSecondCard = ref(false);
const isLoading = ref(true);

// Простая функция транслитерации русских имен на английский
const transliterate = (text: string): string => {
  const rusToEng: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => rusToEng[char] || char).join('');
};

// Загружаем данные пользователя и проверяем наличие второй карты
onMounted(async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Загружаем данные пользователя
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      userData.value = userDoc.data();
      const firstName = userData.value.firstName || '';
      const lastName = userData.value.lastName || '';

      // Русская версия имени
      cardHolderRu.value = `${firstName} ${lastName}`;

      // Английская версия имени (транслитерация)
      cardHolder.value = `${transliterate(firstName)} ${transliterate(lastName)}`.toUpperCase();
    }

    // Проверяем наличие карт в коллекции cards-two
    const cardsTwoQuery = query(
      collection(db, 'cards-two'),
      where('userId', '==', user.uid)
    );
    const querySnapshot = await getDocs(cardsTwoQuery);

    hasSecondCard.value = !querySnapshot.empty;
    isLoading.value = false;
  } catch (error) {
    console.error('Error loading data:', error);
    isLoading.value = false;
  }
});

const addNewCard = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    if (!userData.value) throw new Error('User data not loaded');


    // Создаем карту во второй коллекции
    await addDoc(collection(db, 'cards-two'), {
      type: 'Дебитовая дополнительная',
      cardNumber: generateCardNumber(),
      cardHolderRu: cardHolderRu.value, // Русская версия
      cardHolder: cardHolder.value, // Английская версия
      validThru: generateValidThru(),
      cvv: generateCVV(),
      isActive: true,
      userId: user.uid,
      createdAt: new Date(),
      balance: 0
    });

    // Обновляем статус после создания карты
    hasSecondCard.value = true;
    alert('Дополнительная карта успешно создана!');
  } catch (error) {
    console.error('Error adding cards:', error);
    alert('Ошибка при создании карт');
  }
};

// Генерация случайного номера карты
const generateCardNumber = () => {
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += Math.floor(Math.random() * 10);
    if ((i + 1) % 4 === 0 && i !== 15) result += ' ';
  }
  return result;
};

// Генерация срока действия
const generateValidThru = () => {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = (now.getFullYear() + 3).toString().slice(-2);
  return `${month}/${year}`;
};

// Генерация CVV
const generateCVV = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};
</script>

<template>
  <div class="addCard">
    <div class="addCard__text">
      <h1>Выпустить новую карту</h1>
    </div>
    <div v-if="isLoading" class="loading">
      <p>Проверяем данные...</p>
    </div>
    <div v-else-if="hasSecondCard" class="addCard__exists">
      <p>У вас уже есть дополнительная карта. Вы не можете выпустить больше одной дополнительной карты.</p>
    </div>

    <div v-else class="addCard__content">
      <div class="addCard__content__descriptions">
        <p>
          Дебетовая карта - это виртуальная карта, привязанная к вашему банковскому счету, которая позволяет совершать
          покупки и снимать наличные в пределах доступного баланса.
        </p>
      </div>

      <div class="addCard__content__form">
        <div class="form-row">
          <div class="form-group">
            <h1>Тип карты:</h1>
            <input type="text" value="Дебетовая" disabled class="disabled-input">
          </div>

          <div class="form-group">
            <h1>Номер карты:</h1>
            <input type="text" disabled :value="generateCardNumber()" class="disabled-input">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <h1>Срок действия:</h1>
            <input type="text" disabled :value="generateValidThru()" class="disabled-input">
          </div>

          <div class="form-group">
            <h1>CVV:</h1>
            <input type="text" disabled :value="generateCVV()" class="disabled-input">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <h1>Имя владельца (рус.):</h1>
            <input type="text" disabled :value="cardHolderRu" class="disabled-input">
          </div>

          <div class="form-group">
            <h1>Cardholder name (eng.):</h1>
            <input type="text" disabled :value="cardHolder" class="disabled-input">
          </div>
        </div>

        <button class="submit-btn" @click="addNewCard">
          <h1>Выпустить карту</h1>
        </button>
      </div>
    </div>
  </div>
</template>
<style scoped>
@import "./addCard.scss";
</style>