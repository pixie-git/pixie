import { ref, type Ref } from 'vue';

export interface CanvasNavigationProps {
  width: number;
  height: number;
  initialZoom: number;
}

export function useCanvasNavigation(
  viewportRef: Ref<HTMLDivElement | null>,
  props: Ref<CanvasNavigationProps>
) {
  const scale = ref(props.value.initialZoom);
  const pan = ref({ x: 0, y: 0 });

  const getMinScale = () => {
    if (!viewportRef.value) return 1;
    const { width, height } = props.value;
    if (width === 0 || height === 0) return 1;
    const { width: vw, height: vh } = viewportRef.value.getBoundingClientRect();
    return Math.min(vw / width, vh / height);
  };

  const clampAxis = (val: number, viewSize: number, contentSize: number) => {
    if (contentSize < viewSize) return (viewSize - contentSize) / 2;
    return Math.min(Math.max(val, viewSize - contentSize), 0);
  };

  const clampPan = (x: number, y: number, currentScale: number) => {
    if (!viewportRef.value) return { x, y };
    const { width: vw, height: vh } = viewportRef.value.getBoundingClientRect();
    const { width, height } = props.value;

    return {
      x: clampAxis(x, vw, width * currentScale),
      y: clampAxis(y, vh, height * currentScale)
    };
  };

  const performPan = (deltaX: number, deltaY: number) => {
    const newX = pan.value.x + deltaX;
    const newY = pan.value.y + deltaY;

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

  const fitToScreen = () => {
    if (!viewportRef.value) return;
    const { width, height } = props.value;
    if (width === 0 || height === 0) return;

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

  return {
    scale,
    pan,
    performPan,
    performZoom,
    fitToScreen,
    handleResize
  };
}
