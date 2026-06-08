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
    getRange: vi.fn(),
    del: vi.fn(),
    sAdd: vi.fn(),
    sMembers: vi.fn(),
    sRem: vi.fn(),
    multi: vi.fn().mockReturnThis(),
    exec: vi.fn(),
    withTypeMapping: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (redisModule.getRedisClient as any).mockReturnValue(mockRedis);
    mockRedis.multi.mockReturnThis();
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
      palette: JSON.stringify(['#000', '#fff']),
      paletteLen: '2'
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
    mockRedis.hmGet.mockResolvedValue(['10', '10', '2']);
    // Mock getRange to return a Buffer (redis v5 returnBuffers behavior)
    mockRedis.getRange.mockResolvedValue(Buffer.from([0]));
    const success = await canvasStore.modifyPixelColor(LOBBY_ID, 5, 5, 1);
    expect(success).toBe(true);
    expect(mockRedis.getRange).toHaveBeenCalled();
    expect(mockRedis.setRange).toHaveBeenCalledWith(`lobby:${LOBBY_ID}:canvas`, 55, expect.any(Buffer));
  });

  it('modifyPixelColor should return false for out of bounds', async () => {
    mockRedis.hmGet.mockResolvedValue(['10', '10', '2']);
    const success = await canvasStore.modifyPixelColor(LOBBY_ID, 15, 5, 1);
    expect(success).toBe(false);
  });

  it('modifyPixelColor should return false for invalid non-integer coordinates/color', async () => {
    mockRedis.hmGet.mockResolvedValue(['10', '10', '2']);
    expect(await canvasStore.modifyPixelColor(LOBBY_ID, 1.5, 5, 1)).toBe(false);
    expect(await canvasStore.modifyPixelColor(LOBBY_ID, 5, undefined as any, 1)).toBe(false);
    expect(await canvasStore.modifyPixelColor(LOBBY_ID, 5, 5, null as any)).toBe(false);
  });

  it('modifyPixelBatch should filter out invalid/null/undefined pixel objects', async () => {
    const meta = { width: 10, height: 10, paletteLen: 2 };
    mockRedis.getRange.mockResolvedValue(Buffer.from([0]));
    
    const pixels = [
      { x: 5, y: 5, color: 1 },
      null as any,
      { x: 1.5, y: 5, color: 1 } as any,
      { x: 5, y: undefined as any, color: 1 } as any,
      { x: 12, y: 5, color: 1 }, // out of bounds
    ];

    const result = await canvasStore.modifyPixelBatch(LOBBY_ID, pixels, meta);
    
    // Only the first pixel {x: 5, y: 5, color: 1} should be valid and processed
    expect(result).toEqual([{ x: 5, y: 5, color: 1 }]);
    expect(mockRedis.multi).toHaveBeenCalled();
  });

  it('markLobbyDirty should add lobbyId to dirty set', async () => {
    await canvasStore.markLobbyDirty(LOBBY_ID);
    expect(mockRedis.sAdd).toHaveBeenCalledWith('lobbies:dirty', LOBBY_ID);
  });
});