import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasStore } from '../../src/store/canvas.store.js';
import { CanvasService } from '../../src/services/canvas.service.js';

describe('Canvas Single Pixel Write & Boundary Validation', () => {
  const LOBBY_ID = 'test-lobby';
  const WIDTH = 10;
  const HEIGHT = 10;
  const PALETTE = ['#000000', '#ffffff'];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvasStore
    vi.spyOn(canvasStore, 'getLobbyMetaData').mockResolvedValue({
      width: WIDTH,
      height: HEIGHT,
      palette: PALETTE,
      paletteLen: PALETTE.length
    });
    vi.spyOn(canvasStore, 'modifyPixelColor').mockImplementation(async (id, x, y, color) => {
      if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || color < 0 || color >= PALETTE.length) return false;
      return true;
    });
    vi.spyOn(canvasStore, 'modifyPixelBatch').mockImplementation(async (id, pixels, meta) => {
      return pixels.filter(p => p.x >= 0 && p.x < meta.width && p.y >= 0 && p.y < meta.height && p.color >= 0 && p.color < meta.paletteLen);
    });
    vi.spyOn(canvasStore, 'markLobbyDirty').mockResolvedValue();
    vi.spyOn(canvasStore, 'isLobbyInMemory').mockResolvedValue(true);
  });

  it('should update the matrix correctly for valid coordinates', async () => {
    const x = 5;
    const y = 5;
    const color = 1;

    const result = await CanvasService.draw(LOBBY_ID, x, y, color);

    expect(result).toBe(true);
    expect(canvasStore.modifyPixelColor).toHaveBeenCalledWith(LOBBY_ID, x, y, color);
    expect(canvasStore.markLobbyDirty).toHaveBeenCalledWith(LOBBY_ID);
  });

  it('should repeatedly return false for invalid coordinates outside bounds', async () => {
    // Negative X
    expect(await CanvasService.draw(LOBBY_ID, -1, 5, 1)).toBe(false);
    // Negative Y
    expect(await CanvasService.draw(LOBBY_ID, 5, -1, 1)).toBe(false);

    // X equals / exceeds width
    expect(await CanvasService.draw(LOBBY_ID, WIDTH, 5, 1)).toBe(false);
    expect(await CanvasService.draw(LOBBY_ID, WIDTH + 1, 5, 1)).toBe(false);

    // Y equals / exceeds height
    expect(await CanvasService.draw(LOBBY_ID, 5, HEIGHT, 1)).toBe(false);
    expect(await CanvasService.draw(LOBBY_ID, 5, HEIGHT + 1, 1)).toBe(false);

    // Verify markLobbyDirty was never called because no valid draws occurred
    expect(canvasStore.markLobbyDirty).not.toHaveBeenCalled();
  });
});

describe('Canvas Batch Processing & Conflict Resolution', () => {
  const LOBBY_ID = 'test-lobby';
  const WIDTH = 10;
  const HEIGHT = 10;
  const PALETTE = ['#000000', '#ffffff', '#ff0000', '#00ff00'];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(canvasStore, 'getLobbyMetaData').mockResolvedValue({
      width: WIDTH,
      height: HEIGHT,
      palette: PALETTE,
      paletteLen: PALETTE.length
    });
    vi.spyOn(canvasStore, 'modifyPixelColor').mockImplementation(async (id, x, y, color) => {
      if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || color < 0 || color >= PALETTE.length) return false;
      return true;
    });
    vi.spyOn(canvasStore, 'modifyPixelBatch').mockImplementation(async (id, pixels, meta) => {
      return pixels.filter(p => p.x >= 0 && p.x < meta.width && p.y >= 0 && p.y < meta.height && p.color >= 0 && p.color < meta.paletteLen);
    });
    vi.spyOn(canvasStore, 'markLobbyDirty').mockResolvedValue();
  });

  it('should reject color indices outside the palette bounds', async () => {
    const x = 5;
    const y = 5;
    
    // Palette has 4 colors (0, 1, 2, 3)
    expect(await CanvasService.draw(LOBBY_ID, x, y, 4)).toBe(false); // Too high
    expect(await CanvasService.draw(LOBBY_ID, x, y, -1)).toBe(false); // Negative
    
    expect(canvasStore.markLobbyDirty).not.toHaveBeenCalled();
  });

  it('should resolve concurrent updates safely using last-write-wins', async () => {
    const x = 5;
    const y = 5;
    
    const concurrentDraws = [
      CanvasService.draw(LOBBY_ID, x, y, 1),
      CanvasService.draw(LOBBY_ID, x, y, 2),
      CanvasService.draw(LOBBY_ID, x, y, 3)
    ];

    const results = await Promise.all(concurrentDraws);

    expect(results).toEqual([true, true, true]);
    expect(canvasStore.modifyPixelColor).toHaveBeenCalledTimes(3);
    expect(canvasStore.markLobbyDirty).toHaveBeenCalledTimes(3);
  });

  it('should ignore invalid pixels while successfully processing valid ones in the batch', async () => {
    const batchArray = [
      { x: 0, y: 0, color: 1 },           // Valid
      { x: -5, y: 0, color: 1 },          // Invalid (negative)
      { x: 1, y: 1, color: 2 },           // Valid
      { x: WIDTH + 5, y: 0, color: 1 }    // Invalid (out of bounds)
    ];

    const successfulUpdates = await CanvasService.drawBatch(LOBBY_ID, batchArray);

    // Only 2 valid writes should be returned
    expect(successfulUpdates.length).toBe(2);
    expect(successfulUpdates).toEqual([
      { x: 0, y: 0, color: 1 },
      { x: 1, y: 1, color: 2 }
    ]);

    expect(canvasStore.modifyPixelBatch).toHaveBeenCalled();
    expect(canvasStore.markLobbyDirty).toHaveBeenCalledWith(LOBBY_ID);
  });
});
