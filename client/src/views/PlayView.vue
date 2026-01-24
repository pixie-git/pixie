<script setup lang="ts">
import { onMounted } from 'vue'; // NEW: Importa onMounted
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/stores/editor.store';
import PixelCanvas from '@/components/editor/PixelCanvas.vue';
import ColorSelector from '@/components/editor/ColorSelector.vue'; // Assicurati che il nome corrisponda al tuo file system

// Setup Store
const store = useEditorStore();
// NEW: Estraiamo isConnected per la UI
const { width, height, pixels, palette, selectedColorIndex, isConnected, pixelUpdateEvent } = storeToRefs(store);

// NEW: Quando la vista è montata, avviamo il motore Socket
import { useRoute } from 'vue-router';
const route = useRoute();

onMounted(() => {
  const lobbyName = route.query.lobby as string || 'Default Lobby';
  store.init(lobbyName);
});



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
      :width="width"
      :height="height"
      :pixels="pixels"
      :palette="palette"
      :pixel-update-event="pixelUpdateEvent"
      :zoom="10"
      @stroke-start="({x, y}) => store.startStroke(x, y)"
      @stroke-move="({x, y}) => store.continueStroke(x, y)"
      @stroke-end="store.endStroke()"
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