import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { usePixelBuffer, type PixelBufferProps } from './usePixelBuffer';

describe('usePixelBuffer', () => {
  let mockContext: any;
  let mockCanvas: any;

  beforeEach(() => {
    mockContext = {
      fillRect: vi.fn(),
      fillStyle: '',
      createImageData: vi.fn().mockImplementation((w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4)
      })),
      putImageData: vi.fn(),
    };
    mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
      width: 0,
      height: 0,
    };
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return mockCanvas as any;
      return document.createElement(tagName);
    });
  });

  it('updateBuffer correctly reflects a 2D grid of pixels', () => {
    const props = ref<PixelBufferProps>({
      width: 2,
      height: 2,
      pixels: new Uint8Array([0, 1, 1, 0]),
      palette: ['#ff0000', '#00ff00']
    });

    const { updateBuffer } = usePixelBuffer(props);
    updateBuffer();

    expect(mockCanvas.width).toBe(2);
    expect(mockCanvas.height).toBe(2);
    
    expect(mockContext.putImageData).toHaveBeenCalledTimes(1);
    const imageData = mockContext.putImageData.mock.calls[0][0];
    const data32 = new Uint32Array(imageData.data.buffer);
    
    // ABGR little-endian: 0xFF0000FF for #ff0000, 0xFF00FF00 for #00ff00
    expect(data32[0]).toBe(0xFF0000FF);
    expect(data32[1]).toBe(0xFF00FF00);
    expect(data32[2]).toBe(0xFF00FF00);
    expect(data32[3]).toBe(0xFF0000FF);

    // Should NOT call fillRect
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });

  it('updatePixel updates a single pixel correctly', () => {
    const props = ref<PixelBufferProps>({
      width: 2,
      height: 2,
      pixels: new Uint8Array([0, 0, 0, 0]),
      palette: ['#ff0000', '#00ff00']
    });

    const { updatePixel } = usePixelBuffer(props);
    updatePixel(1, 1, 1);

    expect(mockContext.fillRect).toHaveBeenCalledWith(1, 1, 1, 1);
  });

  it('performance: updateBuffer should be efficient and call fillRect zero times', () => {
    const width = 128;
    const height = 128;
    const props = ref<PixelBufferProps>({
      width,
      height,
      pixels: new Uint8Array(width * height).fill(0),
      palette: ['#000000']
    });

    const { updateBuffer } = usePixelBuffer(props);
    updateBuffer();

    // Now it should NOT call fillRect at all
    expect(mockContext.fillRect).toHaveBeenCalledTimes(0);
    expect(mockContext.putImageData).toHaveBeenCalledTimes(1);
  });

  it('calls onBufferUpdate when buffer is updated', () => {
    const onBufferUpdate = vi.fn();
    const props = ref<PixelBufferProps>({
      width: 1,
      height: 1,
      pixels: new Uint8Array([0]),
      palette: ['#000000']
    });
    const { updateBuffer } = usePixelBuffer(props, onBufferUpdate);
    updateBuffer();
    expect(onBufferUpdate).toHaveBeenCalled();
  });

  it('updates correctly when palette changes', () => {
    const props = ref<PixelBufferProps>({
      width: 1,
      height: 1,
      pixels: new Uint8Array([0]),
      palette: ['#ff0000']
    });

    const { updateBuffer } = usePixelBuffer(props);
    updateBuffer();

    let imageData = mockContext.putImageData.mock.calls[0][0];
    let data32 = new Uint32Array(imageData.data.buffer);
    expect(data32[0]).toBe(0xFF0000FF); // #ff0000

    // Change palette (new reference)
    props.value = {
      ...props.value,
      palette: ['#0000ff']
    };
    updateBuffer();

    imageData = mockContext.putImageData.mock.calls[1][0];
    data32 = new Uint32Array(imageData.data.buffer);
    expect(data32[0]).toBe(0xFFFF0000); // #0000ff
  });
});
