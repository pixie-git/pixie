import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { ILobby } from '../../src/models/Lobby.js';
import { LobbyService } from '../../src/services/lobby.service.js';
import * as redisModule from '../../src/db/redis.js';

vi.mock('../../src/db/redis.js', () => ({
  getRedisClient: vi.fn(),
}));

export const mockLobby = {
  _id: new Types.ObjectId(),
  name: 'Test Lobby',
  description: 'Mock lobby for testing',
  maxCollaborators: 10,
  owner: new Types.ObjectId(),
  canvas: new Types.ObjectId(),
  bannedUsers: [],
  createdAt: new Date(),
  updatedAt: new Date()
} as unknown as ILobby;

describe('LobbyService - Capacity & Resource Management', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      incr: vi.fn(),
      decr: vi.fn(),
      set: vi.fn()
    };
    (redisModule.getRedisClient as any).mockReturnValue(mockRedis);
  });

  it('should throw an error when current count exceeds maxCollaborators', async () => {
    mockRedis.incr.mockResolvedValue(11);
    
    await expect(LobbyService.incrementCapacity(mockLobby)).rejects.toThrow('Lobby is full');
    expect(mockRedis.incr).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.decr).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
  });

  it('should not throw an error when current count is within maxCollaborators', async () => {
    mockRedis.incr.mockResolvedValue(10);
    
    await expect(LobbyService.incrementCapacity(mockLobby)).resolves.toBeUndefined();
    expect(mockRedis.incr).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.decr).not.toHaveBeenCalled();
  });

  it('should decrement capacity correctly', async () => {
    mockRedis.decr.mockResolvedValue(5);
    
    await LobbyService.decrementCapacity(mockLobby._id.toString());
    expect(mockRedis.decr).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('should reset capacity to 0 if it goes below 0', async () => {
    mockRedis.decr.mockResolvedValue(-1);
    
    await LobbyService.decrementCapacity(mockLobby._id.toString());
    expect(mockRedis.decr).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.set).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`, 0);
  });
});
