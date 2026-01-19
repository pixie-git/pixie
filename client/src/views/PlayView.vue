<script setup lang="ts">
import { useEditorStore } from '../stores/editor.store';
import PixelCanvas from '../components/editor/PixelCanvas.vue';
import ColorSelector from '../components/editor/ColorSelector.vue';

const store = useEditorStore();

// Handle pixel click event from the canvas
const onPixelClick = (index: number) => {
  store.paintPixel(index);
};
</script>

<template>
  <div class="play-view">
    <h1>Pixel Canvas Demo</h1>
    
    <!-- Color Picker Component -->
    <ColorSelector v-model="store.selectedColor" />

    <!-- Main Canvas for Drawing -->
    <PixelCanvas 
      :width="store.width" 
      :height="store.height" 
      :zoom="20"
      :pixels="store.pixels" 
      @pixel-click="onPixelClick"
    />
  </div>
</template>

<style scoped>
.play-view {
  padding: 20px;
}
</style>