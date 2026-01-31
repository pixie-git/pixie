<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';

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

const scale = ref(props.initialZoom);
const pan = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const isAltPressed = ref(false);

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
const renderFullCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  if (props.width === 0 || props.height === 0) {
    canvas.width = 0;
    canvas.height = 0;
    return;
  }

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

  /* ------------------------------------------------------------------
     HELPER FUNCTIONS
     ------------------------------------------------------------------ */

  const getMinScale = () => {
    if (!viewportRef.value) return 1;
    if (props.width === 0 || props.height === 0) return 1;
    const { width: vw, height: vh } = viewportRef.value.getBoundingClientRect();
    return Math.min(vw / props.width, vh / props.height);
  };

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

  /* ------------------------------------------------------------------
     CORE LOGIC (Agnostic of Mouse vs. Touch)
     ------------------------------------------------------------------ */

  const getGridCoordinatesFromClient = (clientX: number, clientY: number) => {
    const canvas = canvasRef.value;
    if (!canvas || props.width === 0 || props.height === 0) return null;

    const rect = canvas.getBoundingClientRect();
    
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    const scaleX = rect.width / props.width;
    const scaleY = rect.height / props.height;

    const x = Math.floor(relativeX / scaleX);
    const y = Math.floor(relativeY / scaleY);

    if (x >= 0 && x < props.width && y >= 0 && y < props.height) {
      return { x, y };
    }
    return null;
  };

  const attemptStartStroke = (clientX: number, clientY: number) => {
    const coords = getGridCoordinatesFromClient(clientX, clientY);
    if (coords) {
      emit('stroke-start', coords);
      return true;
    }
    return false;
  };

  const attemptMoveStroke = (clientX: number, clientY: number) => {
    const coords = getGridCoordinatesFromClient(clientX, clientY);
    if (coords) {
      emit('stroke-move', coords);
    }
  };

  const attemptEndStroke = () => {
    emit('stroke-end');
  };

  const performPan = (deltaX: number, deltaY: number) => {
    const newX = pan.value.x + deltaX;
    const newY = pan.value.y + deltaY;
    
    // clampPan depends on current scale
    const clamped = clampPan(newX, newY, scale.value);
    pan.value.x = clamped.x;
    pan.value.y = clamped.y;
  };

  const performZoom = (zoomFactor: number, centerClientX: number, centerClientY: number) => {
    const newScale = scale.value * zoomFactor;
    const MIN_SCALE = getMinScale();
    const MAX_SCALE = 100;
    const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    if (clampedScale === scale.value) return;

    if (viewportRef.value) {
      const rect = viewportRef.value.getBoundingClientRect();
      const mouseX = centerClientX - rect.left;
      const mouseY = centerClientY - rect.top;

      const worldX = (mouseX - pan.value.x) / scale.value;
      const worldY = (mouseY - pan.value.y) / scale.value;
      
      let targetX = mouseX - worldX * clampedScale;
      let targetY = mouseY - worldY * clampedScale;

      const clampedPan = clampPan(targetX, targetY, clampedScale);
      
      pan.value.x = clampedPan.x;
      pan.value.y = clampedPan.y;
    }

    scale.value = clampedScale;
  };

  /* ------------------------------------------------------------------
     MOUSE HANDLERS
     ------------------------------------------------------------------ */

  const handleMouseDown = (e: MouseEvent) => {
    if (e.altKey || isAltPressed.value || e.button === 1) { // Middle click also pans
      isPanning.value = true;
      return;
    }
    if (e.button === 0) {
      attemptStartStroke(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    // Update modifier state
    isAltPressed.value = e.altKey;

    if (isPanning.value) {
      performPan(e.movementX, e.movementY);
      return;
    }

    if (e.buttons === 1) {
      attemptMoveStroke(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isPanning.value) {
      isPanning.value = false;
    } else {
      attemptEndStroke();
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const ZOOM_speed = 1.1;
    // deltaY > 0 -> zoom out, deltaY < 0 -> zoom in
    // If deltaY is positive, we want to divide by speed. 
    // If deltaY is negative, we want to multiply by speed.
    const factor = e.deltaY > 0 ? (1 / ZOOM_speed) : ZOOM_speed;
    
    performZoom(factor, e.clientX, e.clientY);
  };

  /* ------------------------------------------------------------------
     TOUCH HANDLERS
     ------------------------------------------------------------------ */
  
  // State for touch gestures
  const touchState = ref<{
    mode: 'none' | 'drawing' | 'navigating' | 'awaiting_gesture';
    lastPan: { x: number, y: number } | null;
    lastPinchDist: number | null;
    tapTimeout: number | null;
  }>({
    mode: 'none',
    lastPan: null,
    lastPinchDist: null,
    tapTimeout: null
  });

  const getDistance = (t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const getCenter = (t1: Touch, t2: Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  };

  const clearTapTimeout = () => {
    if (touchState.value.tapTimeout !== null) {
      clearTimeout(touchState.value.tapTimeout);
      touchState.value.tapTimeout = null;
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); 

    if (e.touches.length === 1) {
      // One finger -> Wait briefly to see if it's a tap/draw or start of pinch
      touchState.value.mode = 'awaiting_gesture';
      const t = e.touches[0];
      const clientX = t.clientX;
      const clientY = t.clientY;

      // 100ms delay to detect second finger
      touchState.value.tapTimeout = window.setTimeout(() => {
        if (touchState.value.mode === 'awaiting_gesture') {
          touchState.value.mode = 'drawing';
          touchState.value.tapTimeout = null;
          attemptStartStroke(clientX, clientY);
        }
      }, 70); 

    } else if (e.touches.length === 2) {
      // Second finger arrived! Cancel pending draw if any
      if (touchState.value.mode === 'awaiting_gesture') {
        clearTapTimeout();
      } else if (touchState.value.mode === 'drawing') {
        attemptEndStroke(); 
      }
      
      touchState.value.mode = 'navigating';
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      touchState.value.lastPinchDist = getDistance(t1, t2);
      touchState.value.lastPan = getCenter(t1, t2);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();

    if (touchState.value.mode === 'awaiting_gesture' && e.touches.length === 1) {
      // If user moves significantly while waiting, assume drawing
      // ...or just let the timer fire. 
      // If we start immediately on move, we might still catch a "sloppy" pinch 
      // where fingers move before the second one lands.
      // Let's rely on the timer for start, but update position if needed?
      // Actually, if we move, we should probably start drawing immediately 
      // BUT only if we moved enough to be sure it's not a jittery finger waiting for the second one.
      // For simplicity, let's just wait for the timer. 70ms is very short.
      return;
    }

    if (touchState.value.mode === 'drawing' && e.touches.length === 1) {
      const t = e.touches[0];
      attemptMoveStroke(t.clientX, t.clientY);

    } else if (touchState.value.mode === 'navigating' && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      const currentDist = getDistance(t1, t2);
      const currentCenter = getCenter(t1, t2);

      // Handle Zoom
      if (touchState.value.lastPinchDist && touchState.value.lastPinchDist > 0) {
        const factor = currentDist / touchState.value.lastPinchDist;
        performZoom(factor, currentCenter.x, currentCenter.y);
      }

      // Handle Pan
      if (touchState.value.lastPan) {
        const dx = currentCenter.x - touchState.value.lastPan.x;
        const dy = currentCenter.y - touchState.value.lastPan.y;
        performPan(dx, dy);
      }

      touchState.value.lastPinchDist = currentDist;
      touchState.value.lastPan = currentCenter;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();

    if (touchState.value.mode === 'awaiting_gesture') {
      // User tapped and lifted quickly (faster than timer)
      clearTapTimeout();
      // It was a quick tap -> Draw 1 dot
      const t = e.changedTouches[0]; 
      attemptStartStroke(t.clientX, t.clientY);
      attemptEndStroke();
      touchState.value.mode = 'none';

    } else if (touchState.value.mode === 'drawing') {
      if (e.touches.length === 0) {
        attemptEndStroke();
        touchState.value.mode = 'none';
      }
    } else if (touchState.value.mode === 'navigating') {
      if (e.touches.length < 2) {
        touchState.value.mode = 'none';
        touchState.value.lastPinchDist = null;
        touchState.value.lastPan = null;
      }
    }
  };


  /* ------------------------------------------------------------------
     LIFECYCLE
     ------------------------------------------------------------------ */

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Alt' && !e.repeat) {
      e.preventDefault();
      isAltPressed.value = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Alt') {
      isAltPressed.value = false;
      isPanning.value = false; // Stop dragging if Alt is released
    }
  };

  const fitToScreen = () => {
     if (!viewportRef.value) return;
     if (props.width === 0 || props.height === 0) return;
     
     const minScale = getMinScale();
     scale.value = minScale;
     
     const clamped = clampPan(0, 0, scale.value);
     pan.value.x = clamped.x;
     pan.value.y = clamped.y;
  };

  const handleResize = () => {
    if (!viewportRef.value) return;
    
    const minScale = getMinScale();
    if (scale.value < minScale) {
      scale.value = minScale;
    }
    
    const clamped = clampPan(pan.value.x, pan.value.y, scale.value);
    pan.value.x = clamped.x;
    pan.value.y = clamped.y;
  };

  onMounted(() => {
    renderFullCanvas();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => {
      fitToScreen();
    }, 0);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', handleResize);
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
  background-color: #222;
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
  box-shadow: 0 0 20px rgba(0,0,0,0.5); /* Shadow to separate canvas from void */
}
</style>