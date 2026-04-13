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
    
    // Check first pixel (x=0, y=0, colorIndex=0 -> #ff0000)
    expect(mockContext.fillRect).toHaveBeenNthCalledWith(1, 0, 0, 1, 1);
    
    // Check second pixel (x=1, y=0, colorIndex=1 -> #00ff00)
    expect(mockContext.fillRect).toHaveBeenNthCalledWith(2, 1, 0, 1, 1);
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

  it('performance: updateBuffer should be efficient and call fillRect only once', () => {
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

    // This should fail because the current implementation calls fillRect width * height times
    // (128 * 128 = 16,384 times)
    expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
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
});
