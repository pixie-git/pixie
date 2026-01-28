<template>
  <header class="header">
    <div class="logo-section">
      <img src="@/assets/PixieLogo.png" alt="Pixie" class="mini-logo" />
    </div>
    <h1>{{ title }}</h1>
    
    <div class="user-actions">
      <button class="icon-btn" title="Notifications">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      </button>
      <!-- Profile Icon in Header (Desktop Only) -->
      <button class="icon-btn profile-header-btn" title="Profile">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: 'Join a Canvas'
  }
});
</script>

<style scoped>
.header {
  height: 70px;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-shadow: 0 2px 4px var(--color-shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.mini-logo {
  height: 40px;
  width: auto;
  cursor: pointer;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.user-actions {
  display: flex;
  gap: 1rem;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-icon);
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .header {
    padding: 0 1rem;
    height: 60px;
  }
  
  .logo-section {
    display: none; 
  }
  
  .profile-header-btn {
    display: none;
  }
  
  .header h1 {
    font-size: 1.25rem;
  }
}
</style>
