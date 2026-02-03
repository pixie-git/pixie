<template>
  <div id="app">
    <GlobalErrorPopup />
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GlobalErrorPopup from './components/common/GlobalErrorPopup.vue';

export default defineComponent({
  name: 'App',
  components: {
    GlobalErrorPopup
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
