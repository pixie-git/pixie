<template>
  <div class="play-view">
    <h1>Pixel Canvas Demo</h1>
    <div class="controls">
      <label>Color: <input type="color" v-model="selectedColor" /></label>
    </div>
    <PixelCanvas 
      :width="20" 
      :height="20" 
      :pixel-size="20"
      :pixels="dummyPixels" 
      @pixel-click="onPixelClick"
    />
  </div>
</template>

<script>
import PixelCanvas from '../components/PixelCanvas.vue'

export default {
  name: 'PlayView',
  components: {
    PixelCanvas
  },
  data() {
    return {
      selectedColor: '#000000',
      dummyPixels: [
        { x: 19, y: 10, color: 'red' },
        { x: 3, y: 3, color: 'blue' },
        { x: 4, y: 4, color: 'green' }
      ]
    }
  },
  methods: {
    onPixelClick({ x, y }) {
      const existingPixel = this.dummyPixels.find(p => p.x === x && p.y === y);
      if (existingPixel) {
        existingPixel.color = this.selectedColor;
      } else {
        this.dummyPixels.push({ x, y, color: this.selectedColor });
      }
    }
  }
}
</script>

<style scoped>
.controls {
  margin-bottom: 20px;
}
</style>
