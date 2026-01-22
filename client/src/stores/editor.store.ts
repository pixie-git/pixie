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
  const pixelUpdateEvent = ref<{ x: number; y: number; colorIndex: number } | null>(null);

  // Defensive copy of the palette
  const palette = ref<string[]>([...defaultPalette]);

  const selectedColorIndex = ref<number>(1);


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

  const setPixel = (x: number, y: number): void => {
    const index = getPixelIndex(x, y);

    // Skip if out of bounds or if pixel color is unchanged to avoid redundant writes
    if (index !== -1 && pixels.value[index] !== selectedColorIndex.value) {
      // Optimistic Update
      pixels.value[index] = selectedColorIndex.value;

      // Notify Server
      socketService.emitDraw({
        lobbyId: 'default',
        x,
        y,
        color: selectedColorIndex.value
      });

      // Note: With shallowRef, this change is not automatically tracked by Vue.
      // The component handles redraws manually or via specific events.
    }
  };

  const clearCanvas = (): void => {
    pixels.value.fill(0);
  };

  function init() {
    socketService.connect();
    socketService.emitJoinLobby('default');
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
    clearCanvas,
    isConnected,
    init
  };
});