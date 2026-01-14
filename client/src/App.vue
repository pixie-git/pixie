<template>
  <div id="app">
    <h1>Pixel Canvas Demo</h1>
    <PixelCanvas :width="20" :height="20" :pixels="dummyPixels" />
  </div>
</template>

<script>
import PixelCanvas from './components/PixelCanvas.vue'

export default {
  name: 'App',
  components: {
    PixelCanvas
  },
  data() {
    return {
      dummyPixels: [
        { x: 19, y: 10, color: 'red' },
        { x: 3, y: 3, color: 'blue' },
        { x: 4, y: 4, color: 'green' }
      ]
    }
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
