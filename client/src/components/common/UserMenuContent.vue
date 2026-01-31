<template>
  <div class="user-menu">
    <div class="menu-header">
      <span class="username">{{ username }}</span>
    </div>
    <nav class="menu-items">
      <!-- Future: Profile link -->
      <!-- <button class="menu-item" @click="goToProfile">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        Profile
      </button> -->
      <button class="menu-item logout" @click="handleLogout">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        Logout
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user.store';
import { storeToRefs } from 'pinia';

const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const userStore = useUserStore();
const { username } = storeToRefs(userStore);

function handleLogout(): void {
  userStore.logout();
  emit('close');
  router.push('/');
}
</script>

<style scoped>
.menu-header {
  padding: 12px 16px;
  background: var(--color-card-header-bg);
  border-bottom: 1px solid var(--color-border);
}

.username {
  font-weight: 600;
  color: var(--color-text);
}

.menu-items {
  padding: 8px 0;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.menu-item:hover {
  background: var(--color-card-header-bg);
}

.menu-item.logout {
  color: #ef4444;
}

.menu-item.logout:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
