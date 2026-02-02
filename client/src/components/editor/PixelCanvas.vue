<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import { useCanvasTransform } from '../../composables/pixel-canvas/useCanvasTransform';
import { usePixelBuffer } from '../../composables/pixel-canvas/usePixelBuffer';
import { useCanvasRenderer } from '../../composables/pixel-canvas/useCanvasRenderer';
import { useCanvasInput } from '../../composables/pixel-canvas/useCanvasInput';

// --- Props & Emits ---

const props = withDefaults(defineProps<{
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: string[];
  pixelUpdateEvent: { x: number; y: number; colorIndex: number } | { x: number; y: number; colorIndex: number }[] | null;
  initialZoom?: number;
}>(), {
  initialZoom: 10
});

const emit = defineEmits<{
  (e: 'stroke-start', payload: { x: number, y: number }): void;
  (e: 'stroke-move', payload: { x: number, y: number }): void;
  (e: 'stroke-end'): void;
}>();

// --- Refs & Props wrapping ---

const viewportRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const transformProps = computed(() => ({
  width: props.width,
  height: props.height,
  initialZoom: props.initialZoom
}));

const bufferProps = computed(() => ({
  width: props.width,
  height: props.height,
  pixels: props.pixels,
  palette: props.palette
}));

const renderProps = computed(() => ({
  width: props.width,
  height: props.height
}));

// --- Composables ---

// 1. Transform Logic
const { 
  scale, panX, panY, 
  performPan, performZoom, fitToScreen, handleResize, screenToPixel 
} = useCanvasTransform(viewportRef, transformProps, () => render());

// 2. Pixel Buffer
const { 
  pixelBuffer, updateBuffer, updatePixel 
} = usePixelBuffer(bufferProps, () => render());

// 3. Renderer
const { render } = useCanvasRenderer(
  canvasRef, 
  viewportRef, 
  pixelBuffer, 
  { scale, panX, panY }, 
  renderProps
);

// 4. Input Handling
const { 
  isPanning, isAltPressed, 
  handleMouseDown, handleMouseMove, handleMouseUp, 
  handleWheel, handleKeyDown, handleKeyUp, 
  handleTouchStart, handleTouchMove, handleTouchEnd 
} = useCanvasInput({
  onStrokeStart: (coords) => emit('stroke-start', coords),
  onStrokeMove: (coords) => emit('stroke-move', coords),
  onStrokeEnd: () => emit('stroke-end'),
  onPan: performPan,
  onZoom: performZoom,
  screenToPixel
});

// --- Watchers ---

watch(() => [props.width, props.height], () => {
  updateBuffer();
  fitToScreen();
});

watch(() => [props.pixels, props.palette], () => {
  updateBuffer();
  render();
});

watch(() => props.pixelUpdateEvent, (event) => {
  if (!event) return;
  if (Array.isArray(event)) {
    event.forEach(p => updatePixel(p.x, p.y, p.colorIndex));
  } else {
    updatePixel(event.x, event.y, event.colorIndex);
  }
});

// --- Lifecycle ---

onMounted(() => {
  updateBuffer();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('resize', handleResize);
  
  // Initial render after a tick to ensure viewport size is correct
  setTimeout(fitToScreen, 0);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('resize', handleResize);
});

// --- Expose ---

defineExpose({
  updatePixel,
  renderFullCanvas: () => {
    updateBuffer();
    render();
  }
});
</script>

<template>
  <div 
    class="viewport" 
    ref="viewportRef"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @touchstart.prevent="handleTouchStart"
    @touchmove.prevent="handleTouchMove"
    @touchend.prevent="handleTouchEnd"
    @touchcancel.prevent="handleTouchEnd"
    :class="{ 'panning': isAltPressed, 'dragging': isPanning }"
  >
    <canvas ref="canvasRef" class="main-canvas"></canvas>
  </div>
</template>

<style scoped>
.viewport {
  position: relative;
  width: 100%; 
  height: 80vh; 
  overflow: hidden;
  cursor: crosshair;
  user-select: none;
  touch-action: none;
  background-color: #1a1a1a;
}

.viewport.panning {
  cursor: grab;
}

.viewport.dragging {
  cursor: grabbing;
}

.main-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
