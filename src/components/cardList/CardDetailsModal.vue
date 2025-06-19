<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  card: {
    cardNumber: string;
    cvv: string;
    validThru: string;
    cardHolder: string;
    type: string;
    isActive: boolean;
  }
}>();

const emit = defineEmits(['close']);

const closeOnOverlay = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.classList.contains('modal__overlay')) {
    emit('close');
  }
};
</script>

<template>
  <div class="modal__overlay" @click="closeOnOverlay">
    <div class="modal__overlay__content" @click.stop>
      <span class="close" @click="$emit('close')">&times;</span>
      <h3>Реквизиты карты</h3>
      <div class="modal__overlay__content__details">
        <p><strong>Номер карты:</strong> {{ card.cardNumber }}</p>
        <p><strong>Годен до:</strong> {{ card.validThru }}</p>
        <p><strong>CVV:</strong> {{ card.cvv }}</p>
        <p><strong>Владелец:</strong> {{ card.cardHolder }}</p>
        <p><strong>Тип карты:</strong> {{ card.type === 'credit' ? 'Кредитная' : 'Дебетовая' }}</p>
        <p><strong>Статус:</strong> {{ card.isActive ? 'Активна' : 'Неактивна' }}</p>
      </div>
      <button class="close-btn" @click="$emit('close')">Закрыть</button>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.modal__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  &__content {
    background-color: white;
    padding: 25px;
    border-radius: 10px;
    width: 450px;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    position: relative;

    .close {
      position: absolute;
      top: 15px;
      right: 20px;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      transition: color 0.2s;

      &:hover {
        color: #495057;
      }
    }

    h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #212529;
      text-align: center;
    }

    &__details {
      p {
        margin: 12px 0;
        font-size: 16px;
        color: #343a40;

        strong {
          display: inline-block;
          width: 120px;
          color: #495057;
        }
      }
    }

    .close-btn {
      display: block;
      margin: 20px auto 0;
      padding: 8px 20px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: #3367d6;
      }
    }
  }
}
</style>