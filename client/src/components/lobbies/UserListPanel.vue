<script setup lang="ts">
import { ref } from 'vue';
import type { User } from '@/stores/lobby.store';

defineProps<{ users: User[] }>();
const isOpen = ref(true);
</script>

<template>
  <div class="user-panel" :class="{ 'closed': !isOpen }">
    <button class="toggle-btn" @click="isOpen = !isOpen" title="Toggle User List">
      <span v-if="isOpen">→</span>
      <span v-else>←</span>
    </button>

    <div class="content" v-show="isOpen">
      <h3>Users ({{ users.length }})</h3>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.username }}
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
  width: 200px;
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
  right: 100%; 
  margin-right: 5px; /* Place button outside or inside? Let's keep it simple inside top-right or just a clean header toggle */
  /* Actually, for KISS, a header click or specific button inside is fine. */
  /* Let's put it top-right inside the panel */
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

li {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
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
