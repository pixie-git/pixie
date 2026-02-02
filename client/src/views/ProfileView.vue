<template>
  <div class="profile-container">
    <LobbyHeader title="User Profile" />

    <main class="main-content">


      <div class="profile-card">
        <div class="profile-section">
          <h2 class="section-title">Account</h2>
          
          <div class="form-group">
            <label>Username:</label>
            <input type="text" :value="userStore.username" disabled class="input-field" />
          </div>

          <button class="logout-btn" @click="handleLogout">
            Logout
          </button>
        </div>

        <!-- Preferences Section -->
        <div class="profile-section">
          <h2 class="section-title">Preferences</h2>

          <div class="form-group">
            <label>Theme:</label>
            <div class="select-wrapper">
                <select v-model="currentTheme" @change="handleThemeChange" class="select-field">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                </select>
                <svg class="select-arrow" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <div class="form-group-toggle">
            <label>Notifications:</label>
            <div class="toggle-wrapper" @click="toggleNotifications">
               <div class="toggle-switch" :class="{ active: !isMuted }">
                 <div class="toggle-thumb"></div>
               </div>
               <span class="toggle-label">{{ !isMuted ? 'Receive Notifications' : 'Muted' }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <MobileNavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user.store';
import { useInAppNotificationStore } from '../stores/inAppNotification.store';
import { storeToRefs } from 'pinia';
import LobbyHeader from '../components/lobbies/LobbyHeader.vue';
import MobileNavBar from '../components/lobbies/MobileNavBar.vue';

const router = useRouter();
const userStore = useUserStore();
const notificationStore = useInAppNotificationStore();
const { isMuted } = storeToRefs(notificationStore);

const currentTheme = ref('light');

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || document.body.getAttribute('data-theme');
  if (savedTheme) {
    currentTheme.value = savedTheme;
    // Ensure body matches if loaded from storage
    document.body.setAttribute('data-theme', savedTheme);
  }
});

const handleLogout = async () => {
  await userStore.logout();
  router.push('/');
};

const handleThemeChange = () => {  
  document.body.setAttribute('data-theme', currentTheme.value);
  localStorage.setItem('theme', currentTheme.value);
};

const toggleNotifications = () => {
  notificationStore.toggleMute();
};
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: var(--color-background);
  font-family: 'Inter', sans-serif;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}



.profile-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px; /* Slightly squarer as per image? Or standard rounded? Image looks generic. */
  padding: 3rem;
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  box-shadow: 0 4px 6px var(--color-shadow);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.input-field {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.95rem;
  width: 100%;
}

/* Select Styling */
.select-wrapper {
  position: relative;
  width: 100%;
}

.select-field {
  appearance: none;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.95rem;
  width: 100%;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
  width: 16px;
  height: 16px;
}

/* Logout Button */
.logout-btn {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 150px;
}

.logout-btn:hover {
  background: var(--color-btn-hover-bg, rgba(255, 255, 255, 0.1));
}

/* Toggle Switch */
.form-group-toggle {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group-toggle label {
    font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle-switch {
  width: 48px;
  height: 24px;
  background-color: #ccc;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.2s;
  border: 1px solid #999;
}

.toggle-switch.active {
  background-color: #10b981;
  border-color: #10b981;
}

.toggle-switch.active .toggle-thumb {
    transform: translateX(24px);
    background-color: white;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: transform 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.toggle-label {
    font-size: 0.9rem;
    color: var(--color-text);
}

@media (max-width: 768px) {
  .profile-card {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 1.5rem;
  }
}
</style>
