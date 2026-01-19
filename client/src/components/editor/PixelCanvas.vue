<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  width: { type: Number, required: true },  // Canvas Width
  height: { type: Number, required: true }, // Canvas Height
  pixels: { type: Array, required: true },  // Pixel Array
  zoom: { type: Number, default: 20 }       // Pixel size
});

const emit = defineEmits(['pixel-click']);
const canvasRef = ref(null);

const cssWidth = computed(() => props.width * props.zoom);
const cssHeight = computed(() => props.height * props.zoom);

const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Clear the canvas
  ctx.clearRect(0, 0, props.width * props.zoom, props.height * props.zoom);

  for (let i = 0; i < props.pixels.length; i++) {
    const color = props.pixels[i];
    
    const x = (i % props.width) * props.zoom;
    const y = Math.floor(i / props.width) * props.zoom;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, props.zoom, props.zoom);
  }
};

// Setup Iniziale Canvas (Fix DPI + Init)
const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  
  // Dimensioni fisiche (buffer) vs CSS
  canvas.width = cssWidth.value * dpr;
  canvas.height = cssHeight.value * dpr;
  canvas.style.width = `${cssWidth.value}px`;
  canvas.style.height = `${cssHeight.value}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false; // Pixel art nitida

  draw();
};

// Gestione Click
const handleClick = (e) => {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const gridX = Math.floor(x / props.zoom);
  const gridY = Math.floor(y / props.zoom);

  // Bounds check
  if (gridX >= 0 && gridX < props.width && gridY >= 0 && gridY < props.height) {
    // Convertiamo X,Y in Indice Piatto per il Backend
    const index = gridY * props.width + gridX;
    emit('pixel-click', index);
  }
};

// Reattività: Se l'array cambia, ridisegna
watch(() => props.pixels, draw, { deep: true });

onMounted(initCanvas);
</script>

<template>
  <canvas ref="canvasRef" @click="handleClick" class="pixel-canvas"></canvas>
</template>

<style scoped>
.pixel-canvas {
  border: 1px solid #ccc;
  cursor: crosshair;
  display: block; /* Evita whitespace strani */
}
</style>