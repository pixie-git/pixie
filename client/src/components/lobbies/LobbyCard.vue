<template>
  <div class="lobby-card">

    
    <div class="card-content">
      <h3>{{ lobby.name }}</h3>
      <p class="owner">by {{ lobby.owner?.username || 'Unknown' }}</p>
      
      <div class="stats">

        <div class="stat-item">
          <span class="icon">🕒</span>
          <span>{{ formatDate(lobby.createdAt) }}</span>
        </div>
      </div>

      <button v-if="isOwner" @click.stop="$emit('delete', lobby._id)" class="delete-btn">
        Delete
      </button>
      <button @click="$emit('join', lobby._id)" class="join-btn">
        Join Canvas
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ILobby } from '../../types';
import { useUserStore } from '../../stores/user.store';
import { computed } from 'vue';

const props = defineProps<{
  lobby: ILobby;
}>();

defineEmits<{
  (e: 'join', lobbyId: string): void;
  (e: 'delete', lobbyId: string): void;
}>();

const userStore = useUserStore();
const isOwner = computed(() => {
    return props.lobby.owner?._id === userStore.id || userStore.isAdmin;
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>

<style scoped>
.lobby-card {
  background: var(--color-surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px var(--color-shadow);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.lobby-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px var(--color-shadow-hover);
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.owner {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.stats {
  display: flex;
  gap: 1rem;
  margin: 0.2rem 0 0.8rem 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.join-btn {
  width: 100%;
  padding: 10px;
  background-color: var(--color-btn-primary); /* Use centralized variable */
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s, transform 0.1s;
}

.join-btn:hover {
  background-color: var(--color-btn-primary-hover);
}

.join-btn:active {
  transform: scale(0.98);
}

.delete-btn {
  width: 100%;
  padding: 10px;
  background-color: transparent;
  color: #ef4444; /* Red-500 */
  border: 1px solid #ef4444;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
}
</style>
