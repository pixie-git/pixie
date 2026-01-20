<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = withDefaults(defineProps<{
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: string[];
  zoom?: number;
}>(), {
  zoom: 10
});

// Emits 'pixel-click' event with the index of the clicked pixel
const emit = defineEmits<{
  (e: 'pixel-click', payload: { x: number, y: number }): void
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const updatePixel = (x: number, y: number, colorIndex: number) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colorHex = props.palette[colorIndex] || '#000000';
  
  ctx.fillStyle = colorHex;
  ctx.fillRect(
    x * props.zoom, 
    y * props.zoom, 
    props.zoom, 
    props.zoom
  );
};

// Redraw the entire canvas
const drawAll = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = props.width * props.zoom;
  canvas.height = props.height * props.zoom;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < props.height; y++) {
    for (let x = 0; x < props.width; x++) {
      const index = y * props.width + x;
      const colorIndex = props.pixels[index];

      const colorHex = props.palette[colorIndex] || '#000000';
      
      ctx.fillStyle = colorHex;
      ctx.fillRect(x * props.zoom, y * props.zoom, props.zoom, props.zoom);
    }
  }
};

const handleClick = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const x = Math.floor(clickX / props.zoom);
  const y = Math.floor(clickY / props.zoom);

  if (x >= 0 && x < props.width && y >= 0 && y < props.height) {
    emit('pixel-click', { x, y });
  }
};

onMounted(() => {
  drawAll();
});

watch(() => [props.zoom, props.width, props.height], drawAll);

watch(() => props.pixels, drawAll);

defineExpose({
  updatePixel,
  drawAll
});

</script>

<template>
  <canvas 
    ref="canvasRef" 
    @mousedown="handleClick"
    class="pixel-canvas"
  ></canvas>
  </template>

<style scoped>
.pixel-canvas {
  image-rendering: pixelated;
  border: 1px solid #444;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  background-color: #000;
  cursor: crosshair;
}
</style>