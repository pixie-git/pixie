<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="!hideCancel && handleCancel()">
    <div class="modal-content">
      <div class="modal-header" :class="`header-${type}`">
        <h3>{{ title }}</h3>
      </div>
      
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>

      <div class="modal-footer">
        <button v-if="!hideCancel" class="btn-cancel" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="btn-confirm" :class="`btn-${type}`" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useModalStore } from '../../stores/modal.store';

const store = useModalStore();
const { isOpen, title, message, confirmText, cancelText, type, hideCancel } = storeToRefs(store);
const { handleConfirm, handleCancel } = store;
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-header {
  padding: 16px 20px;
  color: white;
}

.header-danger { background-color: #ef4444; }
.header-warning { background-color: #f59e0b; }
.header-info { background-color: #3b82f6; }

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.modal-body {
  padding: 24px 20px;
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.9;
}

.btn-cancel {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-confirm {
  color: white;
}

.btn-danger { background-color: #ef4444; }
.btn-warning { background-color: #f59e0b; }
.btn-info { background-color: #3b82f6; }

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
