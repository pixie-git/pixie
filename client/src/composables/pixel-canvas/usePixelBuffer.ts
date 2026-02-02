import { type Ref } from 'vue';

export interface PixelBufferProps {
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: string[];
}

export function usePixelBuffer(
  props: Readonly<Ref<PixelBufferProps>>,
  onBufferUpdate?: () => void
) {
  // Off-screen buffer for pixel data (never transformed)
  const pixelBuffer = document.createElement('canvas');
  const pixelCtx = pixelBuffer.getContext('2d')!;

  function updateBuffer() {
    const { width, height, pixels, palette } = props.value;
    if (width === 0 || height === 0) return;

    pixelBuffer.width = width;
    pixelBuffer.height = height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = pixels[y * width + x];
        pixelCtx.fillStyle = palette[colorIndex] || '#000000';
        pixelCtx.fillRect(x, y, 1, 1);
      }
    }
    onBufferUpdate?.();
  }

  function updatePixel(x: number, y: number, colorIndex: number) {
    const { palette } = props.value;
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
