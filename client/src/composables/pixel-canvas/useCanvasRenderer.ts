import { type Ref } from 'vue';

export interface CanvasRendererProps {
  width: number;
  height: number;
}

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  viewportRef: Ref<HTMLDivElement | null>,
  pixelBuffer: HTMLCanvasElement,
  transform: {
    scale: Ref<number>;
    panX: Ref<number>;
    panY: Ref<number>;
  },
  props: Readonly<Ref<CanvasRendererProps>>
) {
  function drawGrid(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const s = transform.scale.value;
    const px = transform.panX.value;
    const py = transform.panY.value;

    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;

    ctx.beginPath();

    // Vertical lines
    for (let x = 0; x <= cw; x++) {
      const screenX = Math.floor(px + x * s) + 0.5;
      ctx.moveTo(screenX, py);
      ctx.lineTo(screenX, py + ch * s);
    }

    // Horizontal lines
    for (let y = 0; y <= ch; y++) {
      const screenY = Math.floor(py + y * s) + 0.5;
      ctx.moveTo(px, screenY);
      ctx.lineTo(px + cw * s, screenY);
    }

    ctx.stroke();
    ctx.restore();
  }

  function render() {
    const canvas = canvasRef.value;
    const viewport = viewportRef.value;
    if (!canvas || !viewport) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: cw, height: ch } = props.value;
    if (cw === 0 || ch === 0) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    // Set canvas to viewport size
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, vw, vh);

    const s = transform.scale.value;
    const px = transform.panX.value;
    const py = transform.panY.value;

    // Calculate scaled canvas dimensions
    const scaledW = cw * s;
    const scaledH = ch * s;

    // Draw pixel buffer scaled
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      pixelBuffer,
      0, 0, cw, ch,
      px, py, scaledW, scaledH
    );

    // Draw border around the canvas area
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.floor(px) + 0.5,
      Math.floor(py) + 0.5,
      scaledW,
      scaledH
    );

    // Draw grid if zoomed in enough
    if (s >= 4) {
      drawGrid(ctx, cw, ch);
    }
  }

  return {
    render
  };
}
