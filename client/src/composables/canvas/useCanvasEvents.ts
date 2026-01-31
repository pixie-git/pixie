import { ref, type Ref } from 'vue';

export interface CanvasEventsProps {
  width: number;
  height: number;
}

export interface CanvasEventsCallbacks {
  onStrokeStart: (payload: { x: number; y: number }) => void;
  onStrokeMove: (payload: { x: number; y: number }) => void;
  onStrokeEnd: () => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onZoom: (zoomFactor: number, clientX: number, clientY: number) => void;
}

export function useCanvasEvents(
  canvasRef: Ref<HTMLCanvasElement | null>,
  props: Ref<CanvasEventsProps>,
  callbacks: CanvasEventsCallbacks
) {
  const isPanning = ref(false);
  const isAltPressed = ref(false);

  // --- Helpers ---

  const getGridCoordinatesFromClient = (clientX: number, clientY: number) => {
    const canvas = canvasRef.value;
    const { width, height } = props.value;
    if (!canvas || width === 0 || height === 0) return null;

    const rect = canvas.getBoundingClientRect();

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;

    const x = Math.floor(relativeX / scaleX);
    const y = Math.floor(relativeY / scaleY);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y };
    }
    return null;
  };

  const attemptStartStroke = (clientX: number, clientY: number) => {
    const coords = getGridCoordinatesFromClient(clientX, clientY);
    if (coords) {
      callbacks.onStrokeStart(coords);
      return true;
    }
    return false;
  };

  const attemptMoveStroke = (clientX: number, clientY: number) => {
    const coords = getGridCoordinatesFromClient(clientX, clientY);
    if (coords) {
      callbacks.onStrokeMove(coords);
    }
  };

  // --- Mouse Handlers ---

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
    isAltPressed.value = e.altKey;

    if (isPanning.value) {
      callbacks.onPan(e.movementX, e.movementY);
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
      callbacks.onStrokeEnd();
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const ZOOM_speed = 1.1;
    const factor = e.deltaY > 0 ? (1 / ZOOM_speed) : ZOOM_speed;
    callbacks.onZoom(factor, e.clientX, e.clientY);
  };

  // --- Keyboard Handlers ---

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Alt' && !e.repeat) {
      e.preventDefault();
      isAltPressed.value = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Alt') {
      isAltPressed.value = false;
      isPanning.value = false;
    }
  };

  // --- Touch Handlers ---

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
      touchState.value.mode = 'awaiting_gesture';
      const t = e.touches[0];
      const clientX = t.clientX;
      const clientY = t.clientY;

      touchState.value.tapTimeout = window.setTimeout(() => {
        if (touchState.value.mode === 'awaiting_gesture') {
          touchState.value.mode = 'drawing';
          touchState.value.tapTimeout = null;
          attemptStartStroke(clientX, clientY);
        }
      }, 70);

    } else if (e.touches.length === 2) {
      if (touchState.value.mode === 'awaiting_gesture') {
        clearTapTimeout();
      } else if (touchState.value.mode === 'drawing') {
        callbacks.onStrokeEnd();
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
        callbacks.onZoom(factor, currentCenter.x, currentCenter.y);
      }

      // Handle Pan
      if (touchState.value.lastPan) {
        const dx = currentCenter.x - touchState.value.lastPan.x;
        const dy = currentCenter.y - touchState.value.lastPan.y;
        callbacks.onPan(dx, dy);
      }

      touchState.value.lastPinchDist = currentDist;
      touchState.value.lastPan = currentCenter;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();

    if (touchState.value.mode === 'awaiting_gesture') {
      clearTapTimeout();
      const t = e.changedTouches[0];
      if (attemptStartStroke(t.clientX, t.clientY)) {
        callbacks.onStrokeEnd();
      }
      touchState.value.mode = 'none';

    } else if (touchState.value.mode === 'drawing') {
      if (e.touches.length === 0) {
        callbacks.onStrokeEnd();
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

  return {
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
  };
}
