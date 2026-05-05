import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasStore } from '../../src/store/canvas.store.js';
import * as redisModule from '../../src/db/redis.js';

vi.mock('../../src/db/redis.js', () => ({
  getRedisClient: vi.fn()
}));

describe('CanvasStore', () => {
  const LOBBY_ID = 'test-lobby';
  const mockRedis = {
    exists: vi.fn(),
    hGetAll: vi.fn(),
    get: vi.fn(),
    hSet: vi.fn(),
    set: vi.fn(),
    hmGet: vi.fn(),
    setRange: vi.fn(),
    del: vi.fn(),
    sAdd: vi.fn(),
    sMembers: vi.fn(),
    sRem: vi.fn(),
    withCommandOptions: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (redisModule.getRedisClient as any).mockReturnValue(mockRedis);
  });

  it('isLobbyInMemory should return true if meta key exists', async () => {
    mockRedis.exists.mockResolvedValue(1);
    const result = await canvasStore.isLobbyInMemory(LOBBY_ID);
    expect(result).toBe(true);
    expect(mockRedis.exists).toHaveBeenCalledWith(`lobby:${LOBBY_ID}:meta`);
  });

  it('getLobbyMetaData should parse and return meta from Redis', async () => {
    mockRedis.hGetAll.mockResolvedValue({
      width: '100',
      height: '100',
      palette: JSON.stringify(['#000', '#fff'])
    });
    const result = await canvasStore.getLobbyMetaData(LOBBY_ID);
    expect(result).toEqual({
      width: 100,
      height: 100,
      palette: ['#000', '#fff'],
      paletteLen: 2
    });
  });

  it('modifyPixelColor should use setRange for O(1) update', async () => {
    mockRedis.hmGet.mockResolvedValue(['10', '10', JSON.stringify(['#000', '#fff'])]);
    const success = await canvasStore.modifyPixelColor(LOBBY_ID, 5, 5, 1);
    expect(success).toBe(true);
    expect(mockRedis.setRange).toHaveBeenCalledWith(`lobby:${LOBBY_ID}:canvas`, 55, expect.any(Buffer));
  });

  it('modifyPixelColor should return false for out of bounds', async () => {
    mockRedis.hmGet.mockResolvedValue(['10', '10', JSON.stringify(['#000', '#fff'])]);
    const success = await canvasStore.modifyPixelColor(LOBBY_ID, 15, 5, 1);
    expect(success).toBe(false);
  });

  it('markLobbyDirty should add lobbyId to dirty set', async () => {
    await canvasStore.markLobbyDirty(LOBBY_ID);
    expect(mockRedis.sAdd).toHaveBeenCalledWith('lobbies:dirty', LOBBY_ID);
  });
});