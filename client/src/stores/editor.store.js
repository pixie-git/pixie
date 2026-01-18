// src/stores/editor.store.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEditorStore = defineStore('editor', () => {
  // Configurazione Griglia
  const width = 20;
  const height = 20;

  // STATE: Array piatto di stringhe (400 celle)
  // Inizializziamo tutto bianco
  const pixels = ref(new Array(width * height).fill('#FFFFFF'));

  // STATE: Colore selezionato
  const selectedColor = ref('#000000');

  // INIT: Aggiungiamo i "dummyPixels" di Zava per parità visiva
  // (Conversione: index = y * width + x)
  pixels.value[10 * width + 19] = 'red';   // { x: 19, y: 10 }
  pixels.value[3 * width + 3] = 'blue';  // { x: 3, y: 3 }
  pixels.value[4 * width + 4] = 'green'; // { x: 4, y: 4 }

  // ACTIONS
  function paintPixel(index) {
    // Qui in futuro ci sarà la chiamata Socket
    pixels.value[index] = selectedColor.value;
  }

  function setSelectedColor(color) {
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