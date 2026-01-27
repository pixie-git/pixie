<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

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

// Emits stroke events
const emit = defineEmits<{
  (e: 'stroke-start', payload: { x: number, y: number }): void;
  (e: 'stroke-move', payload: { x: number, y: number }): void;
  (e: 'stroke-end'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const viewportRef = ref<HTMLDivElement | null>(null);

// Navigation State
const scale = ref(props.initialZoom);
const pan = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const isSpacePressed = ref(false);

const updatePixel = (x: number, y: number, colorIndex: number) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colorHex = props.palette[colorIndex] || '#000000';
  
  ctx.fillStyle = colorHex;
  ctx.fillRect(x, y, 1, 1);
};

// Redraw the entire canvas (1:1 scaling)
const drawAll = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = props.width;
  canvas.height = props.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < props.height; y++) {
    for (let x = 0; x < props.width; x++) {
      const index = y * props.width + x;
      const colorIndex = props.pixels[index];
      const colorHex = props.palette[colorIndex] || '#000000';
      ctx.fillStyle = colorHex;
      ctx.fillRect(x, y, 1, 1);
    }
  }
};

const getCoords = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  
  // Calculate relative position within the canvas element
  const relativeX = e.clientX - rect.left;
  const relativeY = e.clientY - rect.top;
  
  const scaleX = rect.width / props.width;
  const scaleY = rect.height / props.height;

  const x = Math.floor(relativeX / scaleX);
  const y = Math.floor(relativeY / scaleY);

  if (x >= 0 && x < props.width && y >= 0 && y < props.height) {
    return { x, y };
  }
  return null;
};

// --- Interaction Handlers ---

const getMinScale = () => {
  if (!viewportRef.value) return 1;
  const { width: vw, height: vh } = viewportRef.value.getBoundingClientRect();
  return Math.min(vw / props.width, vh / props.height);
};

// Helper: Centers content if smaller than view, otherwise clamps to edges
const clampAxis = (val: number, viewSize: number, contentSize: number) => {
  if (contentSize < viewSize) return (viewSize - contentSize) / 2;
  return Math.min(Math.max(val, viewSize - contentSize), 0);
};

const clampPan = (x: number, y: number, scale: number) => {
  if (!viewportRef.value) return { x, y };
  const { width: vw, height: vh } = viewportRef.value.getBoundingClientRect();
  
  return {
    x: clampAxis(x, vw, props.width * scale),
    y: clampAxis(y, vh, props.height * scale)
  };
};

const handleMouseDown = (e: MouseEvent) => {
  if (isSpacePressed.value) {
    isPanning.value = true;
    return;
  }
  const coords = getCoords(e);
  if (coords) {
    emit('stroke-start', coords);
  }
};

const handleMouseMove = (e: MouseEvent) => {
  // Panning Logic
  if (isPanning.value) {
    const newX = pan.value.x + e.movementX;
    const newY = pan.value.y + e.movementY;
    
    // Apply clamping
    const clamped = clampPan(newX, newY, scale.value);
    pan.value.x = clamped.x;
    pan.value.y = clamped.y;
    return;
  }

  // Drawing Logic
  // Check if primary button is pressed
  if (e.buttons !== 1) return;
  
  const coords = getCoords(e);
  if (coords) {
    emit('stroke-move', coords);
  }
};

const handleMouseUp = () => {
  if (isPanning.value) {
    isPanning.value = false;
  } else {
    emit('stroke-end');
  }
};

const handleWheel = (e: WheelEvent) => {
  e.preventDefault();

  // Standard zoom logic:
  // newScale = oldScale * (1 + delta)
  
  const delta = -e.deltaY;
  const zoomFactor = 1.1;
  const newScale = delta > 0 ? scale.value * zoomFactor : scale.value / zoomFactor;

  // Clamp scale
  const MIN_SCALE = getMinScale(); // Dynamic min scale
  const MAX_SCALE = 100;
  const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

  if (clampedScale === scale.value) return;

  // Zoom towards mouse cursor
  if (viewportRef.value) {
    const rect = viewportRef.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate mouse position relative to the transform origin (top-left of content)
    // Current World Pos = (MouseScreen - Pan) / OldScale
    const worldX = (mouseX - pan.value.x) / scale.value;
    const worldY = (mouseY - pan.value.y) / scale.value;

    // We want World Pos to be under Mouse Screen after Zoom
    // MouseScreen = WorldPos * NewScale + NewPan
    // NewPan = MouseScreen - WorldPos * NewScale
    
    let targetX = mouseX - worldX * clampedScale;
    let targetY = mouseY - worldY * clampedScale;

    // Apply strict Pan Clamping on Zoom to prevent going out of bounds
    const clampedPan = clampPan(targetX, targetY, clampedScale);
    
    pan.value.x = clampedPan.x;
    pan.value.y = clampedPan.y;
  }

  scale.value = clampedScale;
};

// Global Input Listeners for Space key
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && !e.repeat) {
    isSpacePressed.value = true;
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false;
    isPanning.value = false; // Stop dragging if space is released
  }
};

// Handle window resizing to keep constraints valid
const handleResize = () => {
  if (!viewportRef.value) return;
  
  // Ensure zoom is at least minScale
  const minScale = getMinScale();
  if (scale.value < minScale) {
    scale.value = minScale;
  }
  
  // Re-clamp pan
  const clamped = clampPan(pan.value.x, pan.value.y, scale.value);
  pan.value.x = clamped.x;
  pan.value.y = clamped.y;
};

onMounted(() => {
  drawAll();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('resize', handleResize);
  
  // Initial center/clamp
  // We need to wait for viewport to exist and have size? onMounted is safer but Vue refs might need a tick?
  // Let's try to set initial constraints immediately if possible or rely on User interaction
  // Better to force it once to prevent off-center start if possible.
  setTimeout(handleResize, 0);
});

// Cleanup would be good but not strictly requested, adding standard cleanup anyway
import { onUnmounted } from 'vue';
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('resize', handleResize);
});

watch(() => [props.width, props.height, props.pixels, props.palette], drawAll);

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
  <div 
    class="viewport" 
    ref="viewportRef"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    :class="{ 'panning': isSpacePressed, 'dragging': isPanning }"
  >
    <div 
      class="grid"
      :style="{
        width: `${props.width * scale}px`,
        height: `${props.height * scale}px`,
        transform: `translate(${pan.x}px, ${pan.y}px)`,
        'background-size': `${scale}px ${scale}px`,
        'background-image': `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`
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
  background-color: #222;
  cursor: crosshair;
  user-select: none;
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
}

.pixel-canvas {
  display: block;
  image-rendering: pixelated;
  background-color: #fff;
  /* No border here, viewport has background */
  box-shadow: 0 0 20px rgba(0,0,0,0.5); /* Shadow to separate canvas from void */
}
</style>