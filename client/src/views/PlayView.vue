<script setup lang="ts">
import { ref, onMounted } from 'vue'; // NEW: Importa onMounted
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/stores/editor.store';
import PixelCanvas from '@/components/editor/PixelCanvas.vue';
import ColorSelector from '@/components/editor/ColorSelector.vue'; // Assicurati che il nome corrisponda al tuo file system

// Setup Store
const store = useEditorStore();
// NEW: Estraiamo isConnected per la UI
const { width, height, pixels, palette, selectedColorIndex, isConnected, pixelUpdateEvent } = storeToRefs(store);

// Ref to call updatePixel
const canvasRef = ref<InstanceType<typeof PixelCanvas> | null>(null);

// NEW: Quando la vista è montata, avviamo il motore Socket
onMounted(() => {
  store.init();
});

/*
watch(pixels, () => {
  canvasRef.value?.drawAll();
});*/

// Update logic (Click -> Store -> Redraw 1 pixel)
const onPixelClick = ({ x, y }: { x: number, y: number }) => {
  store.setPixel(x, y);
  // Aggiornamento visivo immediato (Ottimistico)
  canvasRef.value?.updatePixel(x, y, selectedColorIndex.value);
};
</script>

<template>
  <main>
    <div class="status-bar">
      <span :class="{ online: isConnected }">
        {{ isConnected ? '🟢 ONLINE' : '🔴 CONNECTING...' }}
      </span>
    </div>

    <ColorSelector />

    <PixelCanvas
      ref="canvasRef"
      :width="width"
      :height="height"
      :pixels="pixels"
      :palette="palette"
      :pixel-update-event="pixelUpdateEvent"
      :zoom="10"
      @pixel-click="onPixelClick"
    />
    
    <p style="font-family: monospace; color: gray;">
      Size: {{ width }}x{{ height }} | Selected Color: {{ selectedColorIndex }}
    </p>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

/* NEW: Stili per la status bar */
.status-bar {
  font-family: monospace;
  font-weight: bold;
  color: #ff4444; /* Rosso di default */
}

.status-bar span.online {
  color: #44ff44; /* Verde quando online */
}
</style>