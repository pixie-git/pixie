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
  background: var(--color-surface); /* REF */
  border-radius: 12px;
  width: fit-content;
  box-shadow: 0 2px 8px var(--color-shadow); /* REF */
  border: 1px solid var(--color-border); /* REF */
  max-height: 60vh; /* Limit height to allow scrolling */
  overflow-y: auto; /* Enable vertical scrolling */
}

.color-swatch {
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-border); /* REF */
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px var(--color-shadow-hover); /* REF */
}

.color-swatch.active {
  border-color: var(--color-text); /* REF - Use text color for high contrast border */
  box-shadow: 0 0 0 2px var(--color-shadow);
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