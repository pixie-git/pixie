<script setup lang="ts">
import { ref } from 'vue';
import type { User } from '@/stores/lobby.store';
import type { BannedUser } from '@/services/api';
import { useUserStore } from '@/stores/user.store';
import { useModalStore } from '@/stores/modal.store';

defineProps<{ 
  users: User[];
  bannedUsers?: BannedUser[];
  canModerate?: boolean; 
}>();

const emit = defineEmits<{
  (e: 'kick', userId: string): void;
  (e: 'ban', userId: string): void;
  (e: 'unban', userId: string): void;
}>();

const isOpen = ref(true);
const isBannedOpen = ref(false);
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

const handleUnban = async (userId: string) => {
  const confirmed = await modalStore.confirm({
    title: 'Unban User',
    message: 'Are you sure you want to unban this user? They will be able to rejoin the lobby.',
    confirmText: 'Unban',
    type: 'warning'
  });

  if (confirmed) {
    emit('unban', userId);
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

      <!-- Banned Users Section (Collapsible, only for moderators) -->
      <div v-if="canModerate && bannedUsers && bannedUsers.length > 0" class="banned-section">
        <button 
          class="banned-toggle" 
          @click="isBannedOpen = !isBannedOpen"
          type="button"
        >
          <span class="banned-icon">🚫</span>
          Banned Users ({{ bannedUsers.length }})
          <span class="caret">{{ isBannedOpen ? '▼' : '▶' }}</span>
        </button>
        
        <ul v-show="isBannedOpen" class="banned-list">
          <li v-for="user in bannedUsers" :key="user._id" class="user-item banned">
            <span class="username">{{ user.username }}</span>
            <button class="mod-btn unban" @click="handleUnban(user._id)" title="Unban User">Unban</button>
          </li>
        </ul>
      </div>
    </div>
    
    <div class="mini-badge" v-show="!isOpen">
      {{ users.length }}
    </div>
  </div>
</template>

<style scoped>
.user-panel {
  width: 250px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: relative;
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
  background: var(--color-card-header-bg);
  color: var(--color-icon);
  border: none;
  cursor: pointer;
  padding: 5px;
}

.user-panel.closed .toggle-btn {
  right: auto;
  left: 5px;
}

.content {
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
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
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

ul > li.user-item:last-child {
  border-bottom: none;
}

li.user-item.banned {
  opacity: 0.6;
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

.mod-btn.kick { background-color: #f59e0b; }
.mod-btn.ban { background-color: #ef4444; }
.mod-btn.unban { 
  background-color: #10b981;
  width: auto;
  padding: 0 5px;
}

/* Banned Section */
.banned-section {
  margin-top: auto;
  padding-top: 10px;
  border-top: 2px solid var(--color-border); /* Clearly visible separator based on feedback */
}

.banned-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  background: none;
  border: none;
  padding: 5px 0;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
}

.banned-list {
  margin-top: 5px;
}

.mini-badge {
  margin-top: 45px;
  background: #a855f7;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}
</style>
