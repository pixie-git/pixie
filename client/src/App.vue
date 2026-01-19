<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App'
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
