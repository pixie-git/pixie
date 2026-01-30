import { defineStore } from 'pinia';
import { ref, shallowRef, triggerRef } from 'vue';
import { getPalette } from '../config/palettes';
import { socketService } from '@/services/socket.service';

export const useCanvasStore = defineStore('canvas', () => {

  const width = ref<number>(0);
  const height = ref<number>(0);

  const pixels = shallowRef<Uint8Array>(new Uint8Array(0));

  const pixelUpdateEvent = ref<{ x: number; y: number; colorIndex: number } | { x: number; y: number; colorIndex: number }[] | null>(null);

  const palette = ref<string[]>(getPalette('default'));

  const selectedColorIndex = ref<number>(1);

  const isDrawing = ref(false);
  const lastX = ref<number | null>(null);
  const lastY = ref<number | null>(null);
  const pendingDrawBuffer = ref<{ x: number, y: number, color: number }[]>([]);


  const getColorHex = (index: number): string => {
    return palette.value[index] || '#000000';
  };

  const getPixelIndex = (x: number, y: number): number => {
    if (width.value === 0 || height.value === 0) return -1;

    if (x < 0 || x >= width.value || y < 0 || y >= height.value) {
      return -1;
    }
    return y * width.value + x;
  };

  const getIndexColor = (index: number): string => {
    if (index === -1) return '#000000';
    return getColorHex(pixels.value[index]);
  };

  const getPixelColor = (x: number, y: number): string => {
    const index = getPixelIndex(x, y);
    return getIndexColor(index);
  };


  // --- ACTIONS ---

  const setSelectedColor = (color: number): void => {
    if (color >= 0 && color < palette.value.length) {
      selectedColorIndex.value = color;
    }
  };

  const updatePixelData = (x: number, y: number, color: number): boolean => {
    const index = getPixelIndex(x, y);
    if (index !== -1 && pixels.value[index] !== color) {
      pixels.value[index] = color;
      return true;
    }
    return false;
  };

  const startStroke = (x: number, y: number) => {
    isDrawing.value = true;
    pendingDrawBuffer.value = []; // Reset buffer
    lastX.value = x;
    lastY.value = y;

    if (updatePixelData(x, y, selectedColorIndex.value)) {
      const update = { x, y, colorIndex: selectedColorIndex.value };
      pixelUpdateEvent.value = update;
      pendingDrawBuffer.value.push({ x, y, color: selectedColorIndex.value });
    }
  };

  const continueStroke = (x: number, y: number) => {
    if (!isDrawing.value || lastX.value === null || lastY.value === null) return;

    // Bresenham's Line Algorithm for interpolation
    let x0 = lastX.value;
    let y0 = lastY.value;
    const x1 = x;
    const y1 = y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    const localUpdates: { x: number; y: number; color: number }[] = [];

    while (true) {
      if (updatePixelData(x0, y0, selectedColorIndex.value)) {
        localUpdates.push({ x: x0, y: y0, color: selectedColorIndex.value });
      }

      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    if (localUpdates.length > 0) {
      pixelUpdateEvent.value = localUpdates.map(u => ({ x: u.x, y: u.y, colorIndex: u.color }));
      pendingDrawBuffer.value.push(...localUpdates);
    }

    lastX.value = x;
    lastY.value = y;
  };

  const currentLobbyName = ref<string>('');

  const endStroke = () => {
    if (!isDrawing.value) return;

    isDrawing.value = false;
    lastX.value = null;
    lastY.value = null;

    if (pendingDrawBuffer.value.length > 0 && currentLobbyName.value) {
      socketService.emitDrawBatch({
        lobbyName: currentLobbyName.value,
        pixels: pendingDrawBuffer.value
      });
      pendingDrawBuffer.value = [];
    }
  };

  const setPixel = (x: number, y: number): void => {
    startStroke(x, y);
    endStroke();
  };

  // Emits clear request to server
  const clearLobby = () => {
    if (currentLobbyName.value) {
      socketService.emitClearCanvas(currentLobbyName.value);
    }
  };

  const clearCanvas = (): void => {
    // Replace array to ensure reactivity triggers
    if (width.value > 0 && height.value > 0) {
      pixels.value = new Uint8Array(width.value * height.value);
      triggerRef(pixels); // Explicit trigger just in case
    }
  };

  function init(lobbyName: string) {
    if (!lobbyName) return;
    currentLobbyName.value = lobbyName;

    // We assume socket is connected by lobby store
    // Subscribing to canvas events


    socketService.onInit((state) => {
      const { width: w, height: h, palette: p, data } = state as any;
      width.value = w;
      height.value = h;
      palette.value = (Array.isArray(p) && p.length > 0) ? p : getPalette('default');
      pixels.value = new Uint8Array(data);

      if (selectedColorIndex.value >= palette.value.length) {
        selectedColorIndex.value = 0;
      }

      triggerRef(pixels);
    });

    socketService.onUpdate((data) => {
      const { x, y, color } = data;
      const index = getPixelIndex(x, y);
      if (index !== -1) {
        pixels.value[index] = color;
        pixelUpdateEvent.value = { x, y, colorIndex: color };
      }
    });

    socketService.onUpdateBatch((data) => {
      const { pixels: batchPixels } = data;
      const updates: { x: number, y: number, colorIndex: number }[] = [];

      batchPixels.forEach(({ x, y, color }) => {
        const index = getPixelIndex(x, y);
        if (index !== -1) {
          pixels.value[index] = color;
          updates.push({ x, y, colorIndex: color });
        }
      });

      if (updates.length > 0) {
        pixelUpdateEvent.value = updates;
      }
    });

    socketService.onLobbyDeleted(({ message }) => {
      console.log('[Store] Lobby deleted:', message);

      // Use notification store
      import('../stores/notification').then(({ useNotificationStore }) => {
        const notificationStore = useNotificationStore();
        notificationStore.add(`${message} Redirecting...`, 'error', 5000);
      });

      // Disable canvas to prevent further edits
      isDrawing.value = false;

      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/lobbies';
      }, 1000);
    });

    socketService.onCanvasCleared(() => {
      clearCanvas();
      // Force redraw if needed, but reactivity on pixels should handle it if components watch it
      triggerRef(pixels);
    });
  }

  const reset = () => {
    // socketService.disconnect(); // Handled by lobby store
    currentLobbyName.value = '';
    pendingDrawBuffer.value = [];
    isDrawing.value = false;

    width.value = 0;
    height.value = 0;
    pixels.value = new Uint8Array(0);
    palette.value = getPalette('default');
    selectedColorIndex.value = 0;
  };

  return {
    width,
    height,
    pixels,
    palette,
    selectedColorIndex,
    pixelUpdateEvent,
    getColorHex,
    getPixelIndex,
    getIndexColor,
    getPixelColor,
    setSelectedColor,
    setPixel,
    startStroke,
    continueStroke,
    endStroke,
    clearCanvas,
    clearLobby,
    init,
    reset
  };
});