<template>
  <div v-if="notifications.length > 0" class="popup-overlay">
    <div class="popup-content">
      <div class="popup-header" :class="`header-${currentNotification.type}`">
        <h3>{{ getTitle(currentNotification.type) }}</h3>
      </div>
      
      <div class="popup-body">
        <p>{{ currentNotification.message }}</p>
      </div>

      <div class="popup-footer">
        <button class="close-btn" :class="`btn-${currentNotification.type}`" @click="remove(currentNotification.id)">
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useToastStore, type NotificationType } from '../../stores/toast.store';

const store = useToastStore();
const { notifications } = storeToRefs(store);
const { remove } = store;

// Show the most recent notification (or the first one, depending on preference. LIFO is usually better for alerts)
const currentNotification = computed(() => notifications.value[notifications.value.length - 1]);

const getTitle = (type: NotificationType) => {
  switch (type) {
    case 'error': return 'Error';
    case 'warning': return 'Warning';
    case 'success': return 'Success';
    case 'info': return 'Information';
    default: return 'Notice';
  }
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.popup-content {
  background-color: var(--color-surface, #fff);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.popup-header {
  padding: 16px 20px;
  color: white;
  font-weight: bold;
}

.header-error { background-color: #f44336; }
.header-warning { background-color: #ff9800; }
.header-success { background-color: #4caf50; }
.header-info { background-color: #2196f3; }

.popup-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.popup-body {
  padding: 24px 20px;
  color: var(--color-text, #333);
  font-size: 1rem;
  line-height: 1.5;
}

.popup-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  background-color: var(--color-background, #f5f5f5);
}

.close-btn {
  padding: 8px 24px;
  /* Default color, will be overridden by specific classes */
  background-color: var(--color-primary, #6200ea);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 0.9;
}

.btn-error { background-color: #f44336; }
.btn-warning { background-color: #ff9800; }
.btn-success { background-color: #4caf50; }
.btn-info { background-color: #2196f3; }

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
