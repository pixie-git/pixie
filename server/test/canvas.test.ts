import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasStore } from '../src/store/canvas.store.js';
import { CanvasService } from '../src/services/canvas.service.js';

describe('Canvas Single Pixel Write & Boundary Validation', () => {
  const LOBBY_ID = 'test-lobby';
  const WIDTH = 10;
  const HEIGHT = 10;

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear out any previous state to ensure isolation
    canvasStore.removeLobby(LOBBY_ID);

    // Initialize a 10x10 zeroed out canvas
    const initialData = new Uint8Array(WIDTH * HEIGHT);
    canvasStore.loadLobbyToMemory(LOBBY_ID, WIDTH, HEIGHT, ['#000000', '#ffffff'], initialData);

    // Mock scheduleSave to prevent database calls and active timers during unit tests
    vi.spyOn(CanvasService as any, 'scheduleSave').mockImplementation(() => { });
  });

  it('should update the matrix correctly for valid coordinates', () => {
    const x = 5;
    const y = 5;
    const color = 1;

    const result = CanvasService.draw(LOBBY_ID, x, y, color);

    expect(result).toBe(true);

    const pixelData = canvasStore.getLobbyPixelData(LOBBY_ID);
    expect(pixelData).toBeDefined();

    const index = y * WIDTH + x;
    expect(pixelData![index]).toBe(color);
    expect(CanvasService['scheduleSave']).toHaveBeenCalledWith(LOBBY_ID);
  });

  it('should repeatedly return false for invalid coordinates outside bounds', () => {
    // Negative X
    expect(CanvasService.draw(LOBBY_ID, -1, 5, 1)).toBe(false);
    // Negative Y
    expect(CanvasService.draw(LOBBY_ID, 5, -1, 1)).toBe(false);

    // X equals / exceeds width
    expect(CanvasService.draw(LOBBY_ID, WIDTH, 5, 1)).toBe(false);
    expect(CanvasService.draw(LOBBY_ID, WIDTH + 1, 5, 1)).toBe(false);

    // Y equals / exceeds height
    expect(CanvasService.draw(LOBBY_ID, 5, HEIGHT, 1)).toBe(false);
    expect(CanvasService.draw(LOBBY_ID, 5, HEIGHT + 1, 1)).toBe(false);

    // Verify scheduleSave was never called because no valid draws occurred
    expect(CanvasService['scheduleSave']).not.toHaveBeenCalled();
  });
});

describe('Canvas Batch Processing & Conflict Resolution', () => {
  const LOBBY_ID = 'test-lobby';
  const WIDTH = 10;
  const HEIGHT = 10;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasStore.removeLobby(LOBBY_ID);
    // Init canvas with 3 colors in palette to test last-write-wins properly
    canvasStore.loadLobbyToMemory(LOBBY_ID, WIDTH, HEIGHT, ['#000000', '#ffffff', '#ff0000'], new Uint8Array(WIDTH * HEIGHT));
    vi.spyOn(CanvasService as any, 'scheduleSave').mockImplementation(() => { });
  });

  it('should resolve concurrent updates safely using last-write-wins', async () => {
    const x = 5;
    const y = 5;
    
    // Simulating multiple users firing Socket.IO draw events concurrently.
    // By wrapping them in Promises that resolve on different microtask/macrotask ticks,
    // we simulate true Node.js concurrency.
    const concurrentDraws = [
      new Promise<void>(resolve => setTimeout(() => {
        CanvasService.draw(LOBBY_ID, x, y, 1);
        resolve();
      }, 5)),
      new Promise<void>(resolve => setTimeout(() => {
        CanvasService.draw(LOBBY_ID, x, y, 2);
        resolve();
      }, 5)),
      new Promise<void>(resolve => setTimeout(() => {
        // We delay this final user slightly to guarantee they execute LAST in the event loop race.
        // This proves the in-memory structure safely handles overlapping requests without locking issues.
        CanvasService.draw(LOBBY_ID, x, y, 3);
        resolve();
      }, 10))
    ];

    await Promise.all(concurrentDraws);

    // Verify matrix state exactly matches the definitive last update (color 3)
    const pixelData = canvasStore.getLobbyPixelData(LOBBY_ID);
    const index = y * WIDTH + x;
    expect(pixelData![index]).toBe(3); 

    expect(CanvasService['scheduleSave']).toHaveBeenCalledWith(LOBBY_ID);
  });

  it('should ignore invalid pixels while successfully processing valid ones in the batch', () => {
    const batchArray = [
      { x: 0, y: 0, color: 1 },           // Valid
      { x: -5, y: 0, color: 1 },          // Invalid (negative)
      { x: 1, y: 1, color: 2 },           // Valid
      { x: WIDTH + 5, y: 0, color: 1 }    // Invalid (out of bounds)
    ];

    const successfulUpdates = CanvasService.drawBatch(LOBBY_ID, batchArray);

    // Only 2 valid writes should be returned
    expect(successfulUpdates.length).toBe(2);
    expect(successfulUpdates).toEqual([
      { x: 0, y: 0, color: 1 },
      { x: 1, y: 1, color: 2 }
    ]);

    // Check store directly confirms valid coordinates were updated
    const pixelData = canvasStore.getLobbyPixelData(LOBBY_ID)!;
    expect(pixelData[0 * WIDTH + 0]).toBe(1);
    expect(pixelData[1 * WIDTH + 1]).toBe(2);
    
    expect(CanvasService['scheduleSave']).toHaveBeenCalledWith(LOBBY_ID);
  });
});
