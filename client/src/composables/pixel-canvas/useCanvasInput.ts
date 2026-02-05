import { ref, onUnmounted } from 'vue';

export interface CanvasInputCallbacks {
  onStrokeStart: (coords: { x: number; y: number }) => void;
  onStrokeMove: (coords: { x: number; y: number }) => void;
  onStrokeEnd: () => void;
  onPan: (dx: number, dy: number) => void;
  onZoom: (factor: number, cx: number, cy: number) => void;
  screenToPixel: (x: number, y: number) => { x: number; y: number } | null;
}

export function useCanvasInput(callbacks: CanvasInputCallbacks) {
  const isDrawing = ref(false);
  const isPanning = ref(false);
  const isAltPressed = ref(false);

  // --- Mouse Events ---

  function handleMouseDown(e: MouseEvent) {
    if (e.altKey || isAltPressed.value || e.button === 1) {
      isPanning.value = true;
      return;
    }
    if (e.button === 0) {
      const coords = callbacks.screenToPixel(e.clientX, e.clientY);
      if (coords) {
        isDrawing.value = true;
        callbacks.onStrokeStart(coords);
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    isAltPressed.value = e.altKey;

    if (isPanning.value) {
      callbacks.onPan(e.movementX, e.movementY);
      return;
    }

    if (isDrawing.value && e.buttons === 1) {
      const coords = callbacks.screenToPixel(e.clientX, e.clientY);
      if (coords) {
        callbacks.onStrokeMove(coords);
      }
    }
  }

  function handleMouseUp() {
    if (isPanning.value) {
      isPanning.value = false;
    } else if (isDrawing.value) {
      isDrawing.value = false;
      callbacks.onStrokeEnd();
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    callbacks.onZoom(factor, e.clientX, e.clientY);
  }

  // --- Keyboard Events ---

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Alt' && !e.repeat) {
      e.preventDefault();
      isAltPressed.value = true;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Alt') {
      isAltPressed.value = false;
      isPanning.value = false;
    }
  }

  // --- Touch Events ---
  // Implements the fix for avoiding accidental dots during pinch/zoom

  const lastTouchCenter = ref<{ x: number; y: number } | null>(null);
  const lastPinchDist = ref<number | null>(null);
  const touchMode = ref<'none' | 'draw' | 'navigate' | 'pending'>('none');
  const touchTimeout = ref<number | null>(null);

  function clearTouchTimeout() {
    if (touchTimeout.value !== null) {
      clearTimeout(touchTimeout.value);
      touchTimeout.value = null;
    }
  }

  function getTouchDistance(t1: Touch, t2: Touch): number {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }

  function getTouchCenter(t1: Touch, t2: Touch): { x: number; y: number } {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 1) {
      if (touchMode.value === 'none') {
        touchMode.value = 'pending';
        const t = e.touches[0];
        const clientX = t.clientX;
        const clientY = t.clientY;

        touchTimeout.value = window.setTimeout(() => {
          if (touchMode.value === 'pending') {
            touchMode.value = 'draw';
            touchTimeout.value = null;
            const coords = callbacks.screenToPixel(clientX, clientY);
            if (coords) callbacks.onStrokeStart(coords);
          }
        }, 70); // 70ms delay
      }
    } else if (e.touches.length === 2) {
      // Cancel pending draw if second finger touches
      if (touchMode.value === 'pending') {
        clearTouchTimeout();
        touchMode.value = 'navigate';
      } else if (touchMode.value === 'draw') {
        callbacks.onStrokeEnd();
        touchMode.value = 'navigate';
      } else {
        touchMode.value = 'navigate';
      }

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      lastPinchDist.value = getTouchDistance(t1, t2);
      lastTouchCenter.value = getTouchCenter(t1, t2);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();

    if (touchMode.value === 'pending') return;

    if (touchMode.value === 'draw' && e.touches.length === 1) {
      const t = e.touches[0];
      const coords = callbacks.screenToPixel(t.clientX, t.clientY);
      if (coords) {
        callbacks.onStrokeMove(coords);
      }
    } else if (touchMode.value === 'navigate' && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getTouchDistance(t1, t2);
      const center = getTouchCenter(t1, t2);

      // Pinch zoom
      if (lastPinchDist.value && lastPinchDist.value > 0) {
        const factor = dist / lastPinchDist.value;
        callbacks.onZoom(factor, center.x, center.y);
      }

      // Pan
      if (lastTouchCenter.value) {
        const dx = center.x - lastTouchCenter.value.x;
        const dy = center.y - lastTouchCenter.value.y;
        callbacks.onPan(dx, dy);
      }

      lastPinchDist.value = dist;
      lastTouchCenter.value = center;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    e.preventDefault();

    if (touchMode.value === 'pending') {
      clearTouchTimeout();
      // Verified tap
      const t = e.changedTouches[0];
      const coords = callbacks.screenToPixel(t.clientX, t.clientY);
      if (coords) {
        callbacks.onStrokeStart(coords);
        callbacks.onStrokeEnd();
      }
      touchMode.value = 'none';

    } else if (touchMode.value === 'draw' && e.touches.length === 0) {
      callbacks.onStrokeEnd();
      touchMode.value = 'none';
    } else if (touchMode.value === 'navigate' && e.touches.length < 2) {
      touchMode.value = 'none';
      lastPinchDist.value = null;
      lastTouchCenter.value = null;
    }
  }

  onUnmounted(() => {
    clearTouchTimeout();
  });

  return {
    isPanning,
    isAltPressed,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleKeyDown,
    handleKeyUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}
