<template>
  <div id="app">
    <GlobalErrorPopup />
    <ConfirmationModal />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, watch, onMounted } from 'vue';
import GlobalErrorPopup from './components/common/GlobalErrorPopup.vue';
import ConfirmationModal from './components/common/ConfirmationModal.vue';
import { useInAppNotificationStore } from './stores/inAppNotification.store';
import { useUserStore } from './stores/user.store';

const notificationStore = useInAppNotificationStore();
const userStore = useUserStore();

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
  }
});

watch(
  () => userStore.isAuthenticated,
  (isAuthenticated) => {
    console.log('[App] Auth state changed:', isAuthenticated);
    if (isAuthenticated) {
      notificationStore.setupSSE();
    } else {
      notificationStore.disconnectSSE();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  notificationStore.disconnectSSE();
});
</script>

<style>
/* Reset basic styles */
/* Reset basic styles */
body {
  margin: 0;
  padding: 0;
}
#app {
  /* Removed padding to allow full screen login */
  width: 100%;
  height: 100vh;
}
</style>
