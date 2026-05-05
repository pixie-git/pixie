import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoordinationService } from '../../src/services/coordination.service.js';
import { canvasStore } from '../../src/store/canvas.store.js';
import { CanvasService } from '../../src/services/canvas.service.js';
import * as redisModule from '../../src/db/redis.js';

vi.mock('../../src/db/redis.js', () => ({
  getRedisClient: vi.fn()
}));

vi.mock('../../src/store/canvas.store.js', () => ({
  canvasStore: {
    getDirtyLobbies: vi.fn(),
    removeLobbyFromDirty: vi.fn(),
    markLobbyDirty: vi.fn(),
  }
}));

vi.mock('../../src/services/canvas.service.js', () => ({
  CanvasService: {
    saveToDB: vi.fn(),
  }
}));

describe('CoordinationService', () => {
  const mockRedis = {
    set: vi.fn(),
    eval: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (redisModule.getRedisClient as any).mockReturnValue(mockRedis);
  });

  it('flushDirtyLobbies should do nothing if lock is not acquired', async () => {
    mockRedis.set.mockResolvedValue(null); // NX fails

    await CoordinationService.flushDirtyLobbies();

    expect(canvasStore.getDirtyLobbies).not.toHaveBeenCalled();
    expect(mockRedis.eval).not.toHaveBeenCalled();
  });

  it('flushDirtyLobbies should process dirty lobbies if lock is acquired', async () => {
    mockRedis.set.mockResolvedValue('OK');
    (canvasStore.getDirtyLobbies as any).mockResolvedValue(['lobby1', 'lobby2']);
    (CanvasService.saveToDB as any).mockResolvedValue(undefined);

    await CoordinationService.flushDirtyLobbies();

    expect(canvasStore.removeLobbyFromDirty).toHaveBeenCalledWith('lobby1');
    expect(canvasStore.removeLobbyFromDirty).toHaveBeenCalledWith('lobby2');
    expect(CanvasService.saveToDB).toHaveBeenCalledWith('lobby1');
    expect(CanvasService.saveToDB).toHaveBeenCalledWith('lobby2');
    expect(mockRedis.eval).toHaveBeenCalled(); // Lock release
  });

  it('flushDirtyLobbies should re-mark lobby as dirty if save fails', async () => {
    mockRedis.set.mockResolvedValue('OK');
    (canvasStore.getDirtyLobbies as any).mockResolvedValue(['lobby1']);
    (CanvasService.saveToDB as any).mockRejectedValue(new Error('DB Error'));

    await CoordinationService.flushDirtyLobbies();

    expect(canvasStore.removeLobbyFromDirty).toHaveBeenCalledWith('lobby1');
    expect(CanvasService.saveToDB).toHaveBeenCalledWith('lobby1');
    expect(canvasStore.markLobbyDirty).toHaveBeenCalledWith('lobby1');
    expect(mockRedis.eval).toHaveBeenCalled();
  });
});