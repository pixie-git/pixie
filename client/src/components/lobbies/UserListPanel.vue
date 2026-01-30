<script setup lang="ts">
import { ref } from 'vue';
import type { User } from '@/stores/lobby.store';
import { useUserStore } from '@/stores/user';
import { useModalStore } from '@/stores/modal.store';

defineProps<{ 
  users: User[];
  canModerate?: boolean; 
}>();

const emit = defineEmits<{
  (e: 'kick', userId: string): void;
  (e: 'ban', userId: string): void;
}>();

const isOpen = ref(true);
const userStore = useUserStore();
const modalStore = useModalStore();

const handleKick = async (userId: string) => {
  const confirmed = await modalStore.confirm({
    title: 'Kick User',
    message: 'Are you sure you want to kick this user?',
    confirmText: 'Kick',
    type: 'warning'
  });

  if (confirmed) {
    emit('kick', userId);
  }
};

const handleBan = async (userId: string) => {
  const confirmed = await modalStore.confirm({
    title: 'Ban User',
    message: 'Are you sure you want to BAN this user? They will not be able to rejoin.',
    confirmText: 'Ban',
    type: 'danger'
  });

  if (confirmed) {
    emit('ban', userId);
  }
};
</script>

<template>
  <div class="user-panel" :class="{ 'closed': !isOpen }">
    <button 
      class="toggle-btn" 
      @click="isOpen = !isOpen" 
      title="Toggle User List"
      type="button"
      :aria-label="isOpen ? 'Collapse user list' : 'Expand user list'"
    >
      <span v-if="isOpen">→</span>
      <span v-else>←</span>
    </button>

    <div class="content" v-show="isOpen">
      <h3>Users ({{ users.length }})</h3>
      <ul>
        <li v-for="user in users" :key="user.id" class="user-item">
          <span class="username">{{ user.username }}</span>
          
          <div v-if="canModerate && user.id !== userStore.id" class="mod-actions">
            <button class="mod-btn kick" @click="handleKick(user.id)" title="Kick User">K</button>
            <button class="mod-btn ban" @click="handleBan(user.id)" title="Ban User">B</button>
          </div>
        </li>
      </ul>
    </div>
    
    <div class="mini-badge" v-show="!isOpen">
      {{ users.length }}
    </div>
  </div>
</template>

<style scoped>
.user-panel {
  width: 250px; /* Increased slightly for buttons */
  background: white;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.2s;
  height: 100%;
}

.user-panel.closed {
  width: 40px;
  align-items: center;
}

.toggle-btn {
  position: absolute;
  top: 10px;
  right: 5px;
  background: #eee;
  border: none;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
}
/* Adjust toggle for closed state */
.user-panel.closed .toggle-btn {
  right: auto;
  left: 5px;
}

.content {
  padding: 10px;
  overflow-y: auto;
}

h3 {
  margin: 0 0 10px 0;
  font-size: 1rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li.user-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.username {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.mod-actions {
  display: flex;
  gap: 4px;
}

.mod-btn {
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.7rem;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mod-btn.kick {
  background-color: #f59e0b; /* Amber */
}

.mod-btn.kick:hover {
  background-color: #d97706;
}

.mod-btn.ban {
  background-color: #ef4444; /* Red */
}

.mod-btn.ban:hover {
  background-color: #dc2626;
}

.mini-badge {
  margin-top: 50px;
  background: #a855f7;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}
</style>
