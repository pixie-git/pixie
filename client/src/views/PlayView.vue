<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/stores/editor.store';
import PixelCanvas from '@/components/editor/PixelCanvas.vue';
import ColorSelector from '@/components/editor/ColorSelector.vue';

// Setup Store
const store = useEditorStore();
const { width, height, pixels, palette, selectedColorIndex } = storeToRefs(store);

// Ref per chiamare updatePixel
const canvasRef = ref<InstanceType<typeof PixelCanvas> | null>(null);

// Logica di aggiornamento (Click -> Store -> Ridisegna 1 pixel)
const onPixelClick = ({ x, y }: { x: number, y: number }) => {
  store.setPixel(x, y);
  canvasRef.value?.updatePixel(x, y, selectedColorIndex.value);
};
</script>

<template>
  <main>
    <ColorSelector />

    <PixelCanvas
      ref="canvasRef"
      :width="width"
      :height="height"
      :pixels="pixels"
      :palette="palette"
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
  /* Layout a colonna semplicissimo */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}
</style>