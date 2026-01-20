<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

const props = withDefaults(defineProps<{
  width: number
  height: number
  pixels: string[]
  zoom?: number
}>(), {
  zoom: 20
});

// Emits 'pixel-click' event with the index of the clicked pixel
const emit = defineEmits<{
  (e: 'pixel-click', index: number): void
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const cssWidth = computed(() => props.width * props.zoom);
const cssHeight = computed(() => props.height * props.zoom);

// Redraw the entire canvas
const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear previous content
  ctx.clearRect(0, 0, props.width * props.zoom, props.height * props.zoom);

  // Iterate over all pixels and draw them
  for (let i = 0; i < props.pixels.length; i++) {
    const color = props.pixels[i];
    
    // Calculate x/y position based on index
    const x = (i % props.width) * props.zoom;
    const y = Math.floor(i / props.width) * props.zoom;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, props.zoom, props.zoom);
  }
};

// Initialize canvas with High DPI support
const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  
  // Set actual canvas size to account for DPI
  canvas.width = cssWidth.value * dpr;
  canvas.height = cssHeight.value * dpr;
  // Set visible size
  canvas.style.width = `${cssWidth.value}px`;
  canvas.style.height = `${cssHeight.value}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false; // Keep pixel art sharp
  }

  draw();
};

// Handle clicks on the canvas to detect which pixel was clicked
const handleClick = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const gridX = Math.floor(x / props.zoom);
  const gridY = Math.floor(y / props.zoom);

  if (gridX >= 0 && gridX < props.width && gridY >= 0 && gridY < props.height) {
    const index = gridY * props.width + gridX;
    emit('pixel-click', index);
  }
};

// Watch for pixel changes to redraw
watch(() => props.pixels, draw, { deep: true });

onMounted(initCanvas);
</script>

<template>
  <canvas ref="canvasRef" @click="handleClick" class="pixel-canvas"></canvas>
</template>

<style scoped>
.pixel-canvas {
  border: 1px solid var(--color-border);
  background: var(--color-canvas-bg);
  cursor: crosshair;
  display: block;
  image-rendering: pixelated;
}
</style>