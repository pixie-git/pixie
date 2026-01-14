<template>
  <canvas 
    ref="pixelCanvas" 
    :width="canvasWidth"
    :height="canvasHeight"
    class="pixel-canvas"
  ></canvas>
</template>

<script>
export default {
  name: 'PixelCanvas',
  props: {
    width: { type: Number, default: 64 },
    height: { type: Number, default: 64 },
    pixels: { type: Array, default: () => [] }
  },
  computed: {
    // Ogni pixel logico corrisponde a 10px fisici
    canvasWidth() { return this.width * 10; },
    canvasHeight() { return this.height * 10; }
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
          ctx.fillRect(p.x * 10, p.y * 10, 10, 10);
        }
      });
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
