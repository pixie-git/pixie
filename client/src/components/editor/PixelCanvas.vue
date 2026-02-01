<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import { useCanvasRenderer } from '../../composables/canvas/useCanvasRenderer';
import { useCanvasNavigation } from '../../composables/canvas/useCanvasNavigation';
import { useCanvasEvents } from '../../composables/canvas/useCanvasEvents';

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

const canvasRef = ref<HTMLCanvasElement | null>(null);
const viewportRef = ref<HTMLDivElement | null>(null);

// --- Composables ---

const propsRef = computed(() => props);

const { renderFullCanvas, updatePixel } = useCanvasRenderer(canvasRef, propsRef);

const { 
  scale, 
  pan, 
  performZoom, 
  performPan, 
  fitToScreen, 
  handleResize: handleResizeNav 
} = useCanvasNavigation(viewportRef, propsRef);

const { 
  isPanning, 
  isAltPressed,
  handleMouseDown, 
  handleMouseMove, 
  handleMouseUp, 
  handleWheel, 
  handleKeyDown, 
  handleKeyUp, 
  handleTouchStart, 
  handleTouchMove, 
  handleTouchEnd 
} = useCanvasEvents(canvasRef, propsRef, {
  onStrokeStart: (payload) => emit('stroke-start', payload),
  onStrokeMove: (payload) => emit('stroke-move', payload),
  onStrokeEnd: () => emit('stroke-end'),
  onPan: performPan,
  onZoom: performZoom
});

// --- Lifecycle & Watchers ---

onMounted(() => {
  renderFullCanvas();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('resize', handleResizeNav);
  
  setTimeout(() => {
    fitToScreen();
  }, 0);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('resize', handleResizeNav);
});

watch(() => [props.width, props.height], () => {
  renderFullCanvas();
  fitToScreen();
});

watch(() => [props.pixels, props.palette], renderFullCanvas);

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
  renderFullCanvas
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
    <div 
      class="grid"
      :style="{
        width: `${props.width * scale}px`,
        height: `${props.height * scale}px`,
        transform: `translate(${pan.x}px, ${pan.y}px)`,
        'background-size': `${scale}px ${scale}px`
      }"
    ></div>
    <div 
      class="transform-layer"
      :style="{ 
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` 
      }"
    >
      <canvas 
        ref="canvasRef" 
        class="pixel-canvas"
      ></canvas>
    </div>
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
}

.viewport.panning {
  cursor: grab;
}

.viewport.dragging {
  cursor: grabbing;
}

.transform-layer {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  /* Will-change optimizes compositing */
  will-change: transform;
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: difference;
  image-rendering: pixelated; 
  z-index: 10;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
}

.pixel-canvas {
  display: block;
  image-rendering: pixelated;
  background-color: #fff;
  /* No border here, viewport has background */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>