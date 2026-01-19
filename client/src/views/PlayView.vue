<script setup>
import { useEditorStore } from '../stores/editor.store';
import PixelCanvas from '../components/editor/PixelCanvas.vue';
import ColorSelector from '../components/editor/ColorSelector.vue';

// Inizializzazione Store
const store = useEditorStore();

// Handler Eventi
const onPixelClick = (index) => {
  store.paintPixel(index);
};
</script>

<template>
  <div class="play-view">
    <h1>Pixel Canvas Demo</h1>
    
    <ColorSelector v-model="store.selectedColor" />

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