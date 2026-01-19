import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

export const useEditorStore = defineStore('editor', () => {

  // Hardcoded dimensions for now
  const width: number = 20;
  const height: number = 20;


  // Reactive array of colors (flattened grid)
  const pixels: Ref<string[]> = ref(new Array(width * height).fill('#FFFFFF'));


  // Current selected color for painting
  const selectedColor: Ref<string> = ref('#000000'); // Default to black

  // Initialize some pixels for demonstration
  pixels.value[10 * width + 19] = 'red';
  pixels.value[3 * width + 3] = 'blue';
  pixels.value[4 * width + 4] = 'green';


  // Action to paint a specific pixel with the currently selected color
  function paintPixel(index: number): void {
    pixels.value[index] = selectedColor.value;
  }

  // Action to update the selected color
  function setSelectedColor(color: string): void {
    selectedColor.value = color;
  }

  return {
    width,
    height,
    pixels,
    selectedColor,
    paintPixel,
    setSelectedColor
  };
});