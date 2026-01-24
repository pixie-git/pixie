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
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background: #2c2c2c;
  border-radius: 8px;
  width: fit-content;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: transform 0.1s;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.color-swatch.active {
  border-color: white;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
  transform: scale(1.15);
  z-index: 1;
}
</style>