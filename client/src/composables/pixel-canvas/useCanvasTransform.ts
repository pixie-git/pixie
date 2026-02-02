import { ref, computed, type Ref } from 'vue';

export interface CanvasTransformProps {
  width: number;
  height: number;
  initialZoom?: number;
}

export function useCanvasTransform(
  viewportRef: Ref<HTMLDivElement | null>,
  props: Readonly<Ref<CanvasTransformProps>>,
  onTransformChange?: () => void
) {
  const scale = ref(props.value.initialZoom || 10);
  const panX = ref(0);
  const panY = ref(0);

  const canvasWidth = computed(() => props.value.width);
  const canvasHeight = computed(() => props.value.height);

  function getMinScale(): number {
    const viewport = viewportRef.value;
    if (!viewport) return 1;
    const { width, height } = props.value;
    if (width === 0 || height === 0) return 1;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    return Math.min(vw / width, vh / height);
  }

  function clampPan(x: number, y: number, s: number): { x: number; y: number } {
    const viewport = viewportRef.value;
    if (!viewport) return { x, y };

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const contentW = canvasWidth.value * s;
    const contentH = canvasHeight.value * s;

    const clampAxis = (val: number, viewSize: number, contentSize: number) => {
      if (contentSize < viewSize) return (viewSize - contentSize) / 2;
      return Math.min(Math.max(val, viewSize - contentSize), 0);
    };

    return {
      x: clampAxis(x, vw, contentW),
      y: clampAxis(y, vh, contentH)
    };
  }

  function performPan(dx: number, dy: number) {
    const clamped = clampPan(panX.value + dx, panY.value + dy, scale.value);
    panX.value = clamped.x;
    panY.value = clamped.y;
    onTransformChange?.();
  }

  function performZoom(factor: number, centerX: number, centerY: number) {
    const viewport = viewportRef.value;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const mouseX = centerX - rect.left;
    const mouseY = centerY - rect.top;

    const minScale = getMinScale();
    const maxScale = 100;
    const newScale = Math.min(Math.max(scale.value * factor, minScale), maxScale);

    if (newScale === scale.value) return;

    const worldX = (mouseX - panX.value) / scale.value;
    const worldY = (mouseY - panY.value) / scale.value;

    const targetX = mouseX - worldX * newScale;
    const targetY = mouseY - worldY * newScale;

    const clamped = clampPan(targetX, targetY, newScale);
    panX.value = clamped.x;
    panY.value = clamped.y;
    scale.value = newScale;
    onTransformChange?.();
  }

  function fitToScreen() {
    const minScale = getMinScale();
    scale.value = minScale;
    const clamped = clampPan(0, 0, minScale);
    panX.value = clamped.x;
    panY.value = clamped.y;
    onTransformChange?.();
  }

  function handleResize() {
    const minScale = getMinScale();
    if (scale.value < minScale) {
      scale.value = minScale;
    }
    const clamped = clampPan(panX.value, panY.value, scale.value);
    panX.value = clamped.x;
    panY.value = clamped.y;
    onTransformChange?.();
  }

  function screenToPixel(clientX: number, clientY: number): { x: number; y: number } | null {
    const viewport = viewportRef.value;
    if (!viewport) return null;

    const rect = viewport.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const x = Math.floor((screenX - panX.value) / scale.value);
    const y = Math.floor((screenY - panY.value) / scale.value);

    // Use computed or raw props? raw props are safer inside functions
    if (x >= 0 && x < props.value.width && y >= 0 && y < props.value.height) {
      return { x, y };
    }
    return null;
  }

  return {
    scale,
    panX,
    panY,
    performPan,
    performZoom,
    fitToScreen,
    handleResize,
    screenToPixel
  };
}
