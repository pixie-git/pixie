import { type Ref } from 'vue';

export interface PixelBufferProps {
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: string[];
}

function hexToUint32(hex: string): number {
  const fullHex = hex.length === 4
    ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    : hex;
  const r = parseInt(fullHex.slice(1, 3), 16);
  const g = parseInt(fullHex.slice(3, 5), 16);
  const b = parseInt(fullHex.slice(5, 7), 16);
  return (255 << 24) | (b << 16) | (g << 8) | r;
}

export function usePixelBuffer(
  props: Readonly<Ref<PixelBufferProps>>,
  onBufferUpdate?: () => void
) {
  // Off-screen buffer for pixel data (never transformed)
  const pixelBuffer = document.createElement('canvas');
  const pixelCtx = pixelBuffer.getContext('2d')!;

  // Cache for uint32Palette
  let cachedPalette: string[] | null = null;
  let uint32Palette = new Uint32Array(0);

  function updateBuffer() {
    const { width, height, pixels, palette } = props.value;
    if (width === 0 || height === 0) return;

    pixelBuffer.width = width;
    pixelBuffer.height = height;

    const imageData = pixelCtx.createImageData(width, height);
    const data32 = new Uint32Array(imageData.data.buffer);

    if (palette !== cachedPalette) {
      uint32Palette = new Uint32Array(palette.length);
      for (let i = 0; i < palette.length; i++) {
        uint32Palette[i] = hexToUint32(palette[i]);
      }
      cachedPalette = palette;
    }

    for (let i = 0; i < pixels.length; i++) {
      data32[i] = uint32Palette[pixels[i]] || 0xFF000000;
    }

    pixelCtx.putImageData(imageData, 0, 0);
    onBufferUpdate?.();
  }

  function updatePixel(x: number, y: number, colorIndex: number) {
    const { width, height, palette } = props.value;
    if (x < 0 || y < 0 || x >= width || y >= height) return;

    pixelCtx.fillStyle = palette[colorIndex] || '#000000';
    pixelCtx.fillRect(x, y, 1, 1);
    onBufferUpdate?.();
  }

  return {
    pixelBuffer,
    updateBuffer,
    updatePixel
  };
}
