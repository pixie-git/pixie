<template>
  <div id="app">
    <GlobalErrorPopup />
    <ConfirmationModal />
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GlobalErrorPopup from './components/common/GlobalErrorPopup.vue';
import ConfirmationModal from './components/common/ConfirmationModal.vue';

export default defineComponent({
  name: 'App',
  components: {
    GlobalErrorPopup,
    ConfirmationModal
  }
})
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
