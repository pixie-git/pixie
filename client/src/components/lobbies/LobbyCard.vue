<template>
  <div class="lobby-card">
    <div class="card-header">
      <!-- Placeholder for preview image/pattern -->
      <div class="canvas-preview">
      </div>
    </div>
    
    <div class="card-content">
      <h3>{{ lobby.name }}</h3>
      <p class="owner">by {{ lobby.owner?.username || 'Unknown' }}</p>
      
      <div class="stats">
        <div class="stat-item">
          <span class="icon">👤</span>
          <span>{{ lobby.allowedUsers?.length || 0 }}/50</span>
        </div>
        <div class="stat-item">
          <span class="icon">🕒</span>
          <span>{{ formatDate(lobby.createdAt) }}</span>
        </div>
      </div>

      <button @click="$emit('join', lobby.name)" class="join-btn">
        Join Canvas
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ILobby } from '../types';

defineProps<{
  lobby: ILobby;
}>();

defineEmits<{
  (e: 'join', lobbyName: string): void;
}>();

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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.lobby-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
}

.card-header {
  height: 120px;
  background: #f0f0f0;
  position: relative;
  border-bottom: 1px solid var(--color-border);
}

.canvas-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


.card-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.owner {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.stats {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.8rem;
  color: #666;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.join-btn {
  width: 100%;
  padding: 8px;
  background-color: var(--color-primary); /* Use centralized variable */
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  background-color: #2196F3; /* Fallback/Explicit blue as per mockup */
}

.join-btn:hover {
  background-color: #1976D2;
}
</style>
