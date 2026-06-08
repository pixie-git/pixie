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
      set: vi.fn(),
      exists: vi.fn(),
      del: vi.fn()
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

  it('should decrement capacity correctly and not delete if above 0', async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.decr.mockResolvedValue(5);
    
    await LobbyService.decrementCapacity(mockLobby._id.toString());
    expect(mockRedis.exists).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.decr).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  it('should delete capacity key if it goes to 0 or below', async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.decr.mockResolvedValue(0);
    
    await LobbyService.decrementCapacity(mockLobby._id.toString());
    expect(mockRedis.exists).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.decr).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.del).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
  });

  it('should do nothing if capacity key does not exist', async () => {
    mockRedis.exists.mockResolvedValue(0);
    
    await LobbyService.decrementCapacity(mockLobby._id.toString());
    expect(mockRedis.exists).toHaveBeenCalledWith(`lobby:${mockLobby._id}:count`);
    expect(mockRedis.decr).not.toHaveBeenCalled();
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});
