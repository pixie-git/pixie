import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupRedisAdapter, closeRedisAdapterClients } from '../../src/sockets/redisAdapter.js';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    duplicate: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@socket.io/redis-adapter', () => ({
  createAdapter: vi.fn().mockReturnValue({}),
}));

describe('RedisAdapter', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await closeRedisAdapterClients();
  });

  it('setupRedisAdapter should create and connect pub/sub clients', async () => {
    const adapter = await setupRedisAdapter();
    
    expect(adapter).toBeDefined();
    expect(createClient).toHaveBeenCalled();
    expect(createAdapter).toHaveBeenCalled();
  });

  it('setupRedisAdapter should reuse existing clients if already initialized', async () => {
    await setupRedisAdapter();
    await setupRedisAdapter();
    
    expect(createClient).toHaveBeenCalledTimes(1); // Only once because it reuses
  });

  it('closeRedisAdapterClients should quit clients and reset state', async () => {
    await setupRedisAdapter();
    await closeRedisAdapterClients();
    
    // Re-setup should create new clients
    await setupRedisAdapter();
    expect(createClient).toHaveBeenCalledTimes(2);
  });
});