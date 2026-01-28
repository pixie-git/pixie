<script setup lang="ts">
import { useEditorStore } from '@/stores/editor.store';
import { storeToRefs } from 'pinia';

const store = useEditorStore();

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
  grid-template-columns: repeat(2, 1fr); /* 2 columns like in the design */
  gap: 8px;
  padding: 12px;
  background: #fff; /* White background as per design */
  border-radius: 12px;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(0,0,0,0.1);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
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
</style>