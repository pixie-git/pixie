import { defineStore } from 'pinia';
import { ref, shallowRef, triggerRef } from 'vue';
import { defaultPalette } from '../config/defaultPalette';
import { socketService } from '@/services/socket.service';

export const useEditorStore = defineStore('editor', () => {

  // --- STATE ---

  // Fixed dimensions for MVP
  const width = ref<number>(64);
  const height = ref<number>(64);
  const isConnected = ref(false);

  // Using shallowRef for performance optimization. 
  // Vue won't create a Proxy for every byte, saving CPU/RAM.
  const pixels = shallowRef<Uint8Array>(new Uint8Array(width.value * height.value));

  // Event emitter for individual pixel updates (remote changes)
  // Components can watch this to efficiently redraw single pixels
  // Can be a single update or an array of updates
  const pixelUpdateEvent = ref<{ x: number; y: number; colorIndex: number } | { x: number; y: number; colorIndex: number }[] | null>(null);

  // Defensive copy of the palette
  const palette = ref<string[]>([...defaultPalette]);

  const selectedColorIndex = ref<number>(1);

  // --- DRAWING STATE ---
  const isDrawing = ref(false);
  const lastX = ref<number | null>(null);
  const lastY = ref<number | null>(null);
  const pixelsBuffer = ref<{ x: number, y: number, color: number }[]>([]);


  // --- GETTERS ---

  const getColorHex = (index: number): string => {
    return palette.value[index] || '#000000';
  };

  const getPixelIndex = (x: number, y: number): number => {
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

  // Helper for optimistic update
  // Returns true if pixel was actually changed
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
    pixelsBuffer.value = []; // Reset buffer
    lastX.value = x;
    lastY.value = y;

    // Draw the initial point
    if (updatePixelData(x, y, selectedColorIndex.value)) {
      const update = { x, y, colorIndex: selectedColorIndex.value };
      pixelUpdateEvent.value = update;
      pixelsBuffer.value.push({ x, y, color: selectedColorIndex.value });
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
      // Batch update to UI
      pixelUpdateEvent.value = localUpdates.map(u => ({ x: u.x, y: u.y, colorIndex: u.color }));
      // Add to network buffer
      pixelsBuffer.value.push(...localUpdates);
    }

    lastX.value = x;
    lastY.value = y;
  };

  const endStroke = () => {
    if (!isDrawing.value) return;

    isDrawing.value = false;
    lastX.value = null;
    lastY.value = null;

    // Send the buffer to the server
    if (pixelsBuffer.value.length > 0) {
      socketService.emitDrawBatch({
        lobbyName: 'Default Lobby',
        pixels: pixelsBuffer.value
      });
      pixelsBuffer.value = [];
    }
  };

  // Deprecated: kept for single click compatibility if needed, 
  // but startStroke/endStroke handles single points too.
  const setPixel = (x: number, y: number): void => {
    startStroke(x, y);
    endStroke();
  };

  const clearCanvas = (): void => {
    pixels.value.fill(0);
  };

  function init() {
    socketService.connect();
    socketService.emitJoinLobby('Default Lobby');
    isConnected.value = true;

    // Logic to bind Model events to ViewModel state
    socketService.onInit((buffer) => {
      pixels.value = new Uint8Array(buffer);
      triggerRef(pixels);
    });

    socketService.onUpdate((data) => {
      const { x, y, color } = data;
      const index = getPixelIndex(x, y);
      if (index !== -1) {
        pixels.value[index] = color;
        // Emit event for efficient single-pixel canvas update
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
  }

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
    isConnected,
    init
  };
});