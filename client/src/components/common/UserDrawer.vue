<template>
  <div v-if="isOpen">
    <div class="drawer-backdrop" @click="$emit('close')"></div>
    <div class="user-drawer" @keydown.escape="$emit('close')" tabindex="-1">
      <button class="close-btn" @click="$emit('close')" aria-label="Close">✕</button>
      <UserMenuContent @close="$emit('close')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import UserMenuContent from './UserMenuContent.vue';

defineProps<{ isOpen: boolean }>();
defineEmits<{ close: [] }>();
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.user-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: var(--color-surface);
  z-index: 9999;
  box-shadow: -4px 0 16px var(--color-shadow);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-icon);
  cursor: pointer;
  padding: 4px 8px;
}
</style>
