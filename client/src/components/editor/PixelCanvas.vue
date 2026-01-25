<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = withDefaults(defineProps<{
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: string[];
  pixelUpdateEvent: { x: number; y: number; colorIndex: number } | { x: number; y: number; colorIndex: number }[] | null;
  zoom?: number;
}>(), {
  zoom: 10
});

// Emits stroke events
const emit = defineEmits<{
  (e: 'stroke-start', payload: { x: number, y: number }): void;
  (e: 'stroke-move', payload: { x: number, y: number }): void;
  (e: 'stroke-end'): void;
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

const getCoords = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const x = Math.floor(clickX / props.zoom);
  const y = Math.floor(clickY / props.zoom);

  if (x >= 0 && x < props.width && y >= 0 && y < props.height) {
    return { x, y };
  }
  return null;
};

const handleMouseDown = (e: MouseEvent) => {
  const coords = getCoords(e);
  if (coords) {
    emit('stroke-start', coords);
  }
};

const handleMouseMove = (e: MouseEvent) => {
  // Check if primary button is pressed
  if (e.buttons !== 1) return;
  
  const coords = getCoords(e);
  if (coords) {
    emit('stroke-move', coords);
  }
};

const handleMouseUp = () => {
  emit('stroke-end');
};

onMounted(() => {
  drawAll();
});

watch(() => [props.zoom, props.width, props.height, props.pixels], drawAll);

// Efficiently handle remote pixel updates - only redraw the changed pixel
watch(() => props.pixelUpdateEvent, (event) => {
  if (!event) return;

  if (Array.isArray(event)) {
    event.forEach(p => updatePixel(p.x, p.y, p.colorIndex));
  } else {
    updatePixel(event.x, event.y, event.colorIndex);
  }
});

defineExpose({
  updatePixel,
  drawAll
});

</script>

<template>
  <div class="canvas-wrapper" :style="{ '--zoom': props.zoom + 'px' }">
    <div class="grid"></div>
    <canvas 
      ref="canvasRef" 
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      class="pixel-canvas"
    ></canvas>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  position: relative;
  display: inline-block; /* Fits the content */
}

/* 
  Grid Overlay 
  Uses CSS gradients to create a grid pattern efficiently.
  Pointer events are disabled so drawing on the canvas underneath works.
*/
.grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-size: var(--zoom) var(--zoom);
  /* Use difference blend mode so lines act as inversion filters */
  mix-blend-mode: difference;
  image-rendering: pixelated; /* Fix for variable line thickness */
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
  z-index: 10; /* Ensure it's above the canvas */
}

.pixel-canvas {
  display: block; /* Removes default inline spacing */
  image-rendering: pixelated;
  border: 1px solid #444;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  background-color: #000;
  cursor: crosshair;
}
</style>