<template>
  <div id="app">
    <GlobalErrorPopup />
    <ConfirmationModal />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, watch } from 'vue';
import GlobalErrorPopup from './components/common/GlobalErrorPopup.vue';
import ConfirmationModal from './components/common/ConfirmationModal.vue';
import { useInAppNotificationStore } from './stores/inAppNotification.store';
import { useUserStore } from './stores/user.store';

const notificationStore = useInAppNotificationStore();
const userStore = useUserStore();

// Reactive SSE setup
// When user logs in (token becomes available), setup SSE
// When user logs out (token removed), disconnect SSE
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
  { immediate: true } // Check immediately on mount
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
