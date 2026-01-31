<template>
  <footer class="bottom-nav">
    <div class="nav-item">
       <img src="@/assets/PixieLogo.png" alt="Pixie" class="nav-logo" @click="$router.push('/lobbies')" />
    </div>
    
    <div class="nav-item fab-container">
      <button class="fab-btn" @click="$router.push('/create-lobby')">+</button>
    </div>

    <div class="nav-item">
      <button class="nav-icon-btn" title="Profile" @click="isDrawerOpen = true">
         <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </button>
    </div>
  </footer>

  <UserDrawer :is-open="isDrawerOpen" @close="isDrawerOpen = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UserDrawer from '../common/UserDrawer.vue';

const isDrawerOpen = ref(false);
</script>

<style scoped>
/* Bottom Nav (Hidden by default on Desktop) */
.bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  /* Bottom Nav (Visible on Mobile) */
  .bottom-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 70px;
    background: var(--color-navbar-bg); 
    box-shadow: 0 -2px 10px var(--color-shadow);
    padding: 0 1rem;
    box-sizing: border-box;
    z-index: 100;
  }
  
  .nav-item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .nav-logo {
    height: 40px;
    width: auto;
    cursor: pointer;
  }

  .nav-icon-btn {
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    cursor: pointer;
    color: var(--color-icon);
  }
  
  /* FAB Button */
  .fab-btn {
    background-color: var(--color-btn-primary);
    color: white;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    font-size: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    cursor: pointer;
    transform: translateY(-20px); /* Popped out effect */
  }
}
</style>
