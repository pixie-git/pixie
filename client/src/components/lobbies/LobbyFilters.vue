<template>
  <div class="controls-bar">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input 
        :value="searchQuery" 
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text" 
        placeholder="Search Canvases" 
        class="search-input"
      />
    </div>

    <div class="filters">
      <button 
        :class="['filter-btn', { active: filter === 'all' }]"
        @click="$emit('update:filter', 'all')"
      >
        All
      </button>
      <button 
        :class="['filter-btn', { active: filter === 'mine' }]"
        @click="$emit('update:filter', 'mine')"
      >
        My Canvases
      </button>
    </div>

    <div class="spacer"></div>

    <!-- Create Button (Desktop Only) -->
    <button class="create-btn desktop-create-btn" title="Create (Coming Soon)">
      + Create New Canvas
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  searchQuery: string;
  filter: 'all' | 'mine';
}>();

defineEmits<{
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:filter', value: 'all' | 'mine'): void;
}>();
</script>

<style scoped>
.controls-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0 10px;
  width: 300px;
}

.search-input {
  border: none;
  padding: 10px;
  width: 100%;
  outline: none;
}

.filters {
  display: flex;
  background: #e0e0e0;
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
}

.filter-btn {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.filter-btn.active {
  background: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.spacer {
  flex: 1;
}

.create-btn {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  background-color: #2196F3;
}

@media (max-width: 768px) {
  .controls-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-box {
    width: 100%;
  }
  
  .desktop-create-btn {
    display: none;
  }
  
  .spacer {
    display: none;
  }
}
</style>
