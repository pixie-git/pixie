<template>
  <div class="lobbies-container">
    <LobbyHeader />

    <main class="main-content">
      <LobbyFilters 
        v-model:searchQuery="searchQuery" 
        v-model:filter="filter" 
      />

      <LobbyGrid 
        :lobbies="filteredLobbies"
        :loading="loading"
        :error="error"
        @join="handleJoin"
      />
    </main>
    
    <MobileNavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { getLobbies } from '../services/api';
import type { ILobby } from '../types';

// Components
import LobbyHeader from '../components/lobbies/LobbyHeader.vue';
import LobbyFilters from '../components/lobbies/LobbyFilters.vue';
import LobbyGrid from '../components/lobbies/LobbyGrid.vue';
import MobileNavBar from '../components/lobbies/MobileNavBar.vue';

const router = useRouter();
const userStore = useUserStore();

const lobbies = ref<ILobby[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const filter = ref<'all' | 'mine'>('all');

const fetchLobbies = async () => {
  try {
    loading.value = true;
    const response = await getLobbies();
    lobbies.value = response.data;
  } catch (err) {
    console.error(err);
    error.value = "Failed to load lobbies";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLobbies);

const filteredLobbies = computed(() => {
  let result = lobbies.value;

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(l => l.name.toLowerCase().includes(q));
  }

  if (filter.value === 'mine') {
    result = result.filter(l => l.owner?.username === userStore.username);
  }

  return result;
});

const handleJoin = (lobbyName: string) => {
    router.push({ path: '/play', query: { lobby: lobbyName } });
};
</script>

<style scoped>
.lobbies-container {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
