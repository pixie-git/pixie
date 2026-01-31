import { ref, watch, type Ref } from 'vue';

export interface CanvasRendererProps {
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: string[];
}

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  props: Ref<CanvasRendererProps>
) {

  const renderFullCanvas = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, pixels, palette } = props.value;

    if (width === 0 || height === 0) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const colorIndex = pixels[index];
        const colorHex = palette[colorIndex] || '#000000';
        ctx.fillStyle = colorHex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  const updatePixel = (x: number, y: number, colorIndex: number) => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { palette } = props.value;
    const colorHex = palette[colorIndex] || '#000000';

    ctx.fillStyle = colorHex;
    ctx.fillRect(x, y, 1, 1);
  };

  return {
    renderFullCanvas,
    updatePixel
  };
}
