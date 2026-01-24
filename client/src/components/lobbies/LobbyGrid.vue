<template>
  <div v-if="loading" class="loading">Loading lobbies...</div>
  <div v-else-if="error" class="error">{{ error }}</div>

  <div v-else class="grid">
    <LobbyCard 
      v-for="lobby in lobbies" 
      :key="lobby._id" 
      :lobby="lobby" 
      @join="$emit('join', $event)"
    />
    
    <div v-if="lobbies.length === 0" class="empty-state">
      No canvases found. Create one to start!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ILobby } from '../../types';
import LobbyCard from './LobbyCard.vue';

defineProps<{
  lobbies: ILobby[];
  loading: boolean;
  error: string;
}>();

defineEmits<{
  (e: 'join', lobbyName: string): void;
}>();
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding-bottom: 80px;
  }
}
</style>
