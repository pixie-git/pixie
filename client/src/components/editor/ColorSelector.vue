<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas.store';
import { storeToRefs } from 'pinia';

const store = useCanvasStore();

const { palette, selectedColorIndex } = storeToRefs(store);

const selectColor = (index: number) => {
  store.setSelectedColor(index);
};
</script>

<template>
  <div class="color-picker">
    <div 
      v-for="(color, index) in palette" 
      :key="index"
      class="color-swatch"
      :class="{ active: selectedColorIndex === index }"
      :style="{ backgroundColor: color }"
      @click="selectColor(index)"
    ></div>
  </div>
</template>

<style scoped>
.color-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 columns for better density */
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  max-height: 60vh; /* Limit height to allow scrolling */
  overflow-y: auto; /* Enable vertical scrolling */
}

.color-swatch {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(0,0,0,0.1);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.color-swatch.active {
  border-color: #333;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
  transform: scale(1.15);
  z-index: 1;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .color-picker {
    display: flex;
    flex-direction: row;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    padding: 8px;
    gap: 12px;
    border: none;
    box-shadow: none;
    background: transparent;
    justify-content: center; /* Center if few colors, or start if scrolling */
  }

  .color-swatch {
    width: 36px;
    height: 36px;
  }
}
</style>