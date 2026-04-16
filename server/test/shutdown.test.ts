import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasService } from '../src/services/canvas.service.js';
import { canvasStore } from '../src/store/canvas.store.js';

describe('CanvasService Graceful Shutdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate some lobbies in memory
    vi.spyOn(canvasStore, 'getInMemoryLobbyIds').mockReturnValue(['lobby-1', 'lobby-2']);
  });

  it('should call saveToDB for every in-memory lobby during saveAll', async () => {
    const saveToDBSpy = vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined);

    // This method doesn't exist yet!
    await (CanvasService as any).saveAll();

    expect(saveToDBSpy).toHaveBeenCalledTimes(2);
    expect(saveToDBSpy).toHaveBeenCalledWith('lobby-1');
    expect(saveToDBSpy).toHaveBeenCalledWith('lobby-2');
  });
});
