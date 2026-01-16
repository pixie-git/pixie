<template>
  <canvas 
    ref="pixelCanvas" 
    :width="canvasWidth"
    :height="canvasHeight"
    class="pixel-canvas"
    @click="onCanvasClick"
  ></canvas>
</template>

<script>
export default {
  name: 'PixelCanvas',
  props: {
    width: { type: Number, default: 64 },
    height: { type: Number, default: 64 },
    pixels: { type: Array, default: () => [] },
    pixelSize: { type: Number, default: 10 }
  },
  emits: ['pixel-click'],
  computed: {
    // Ogni pixel logico corrisponde a pixelSize px fisici
    canvasWidth() { return this.width * this.pixelSize; },
    canvasHeight() { return this.height * this.pixelSize; }
  },
  watch: {
    pixels: {
      handler() {
        this.drawCanvas();
      },
      deep: true
    }
  },
  mounted() {
    this.drawCanvas();
  },
  methods: {
    drawCanvas() {
      const canvas = this.$refs.pixelCanvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.pixels.forEach(p => {
        if (p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height) {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x * this.pixelSize, p.y * this.pixelSize, this.pixelSize, this.pixelSize);
        }
      });
    },
    onCanvasClick(event) {
      const { x, y } = this.getGridCoordinates(event);
      
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.$emit('pixel-click', { x, y });
      }
    },
    getGridCoordinates(event) {
      const canvas = this.$refs.pixelCanvas;
      const rect = canvas.getBoundingClientRect();
      
      return {
        x: Math.floor((event.clientX - rect.left) / this.pixelSize),
        y: Math.floor((event.clientY - rect.top) / this.pixelSize)
      };
    }
  }
}
</script>

<style scoped>
.pixel-canvas {
  border: 1px solid #ccc;
  background: white;
  cursor: crosshair;
  image-rendering: pixelated; 
}
</style>
