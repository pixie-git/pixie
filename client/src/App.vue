<template>
  <div id="app">
    <PlayView />
  </div>
</template>

<script>
import PlayView from './views/PlayView.vue'

export default {
  name: 'App',
  components: {
    PlayView
  }
}
</script>

<style>
/* Reset basic styles */
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}
#app {
  padding: 20px;
}
</style>
