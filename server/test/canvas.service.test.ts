import { describe, it, expect, vi } from 'vitest';
import { CanvasService } from '../src/services/canvas.service.js';
import { canvasStore } from '../src/store/canvas.store.js';

describe('CanvasService - Lifecycle and Memory Cleanup', () => {
  it('should remove lobby canvas state from memory when unloaded', async () => {
    const lobbyId = 'lobby_to_unload';

    const mockData = new Uint8Array(100);
    canvasStore.loadLobbyToMemory(lobbyId, 10, 10, ['#000', '#FFF'], mockData);

    expect(canvasStore.isLobbyInMemory(lobbyId)).toBe(true);

    const saveSpy = vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined);

    await CanvasService.unloadLobby(lobbyId);

    expect(canvasStore.isLobbyInMemory(lobbyId)).toBe(false);
    expect(saveSpy).toHaveBeenCalledWith(lobbyId);

    saveSpy.mockRestore();
  });
});
