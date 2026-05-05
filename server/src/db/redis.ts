import { createClient, RedisClientType } from 'redis';
import { CONFIG } from '../config.js';

let redisClient: RedisClientType | null = null;

/**
 * Initializes and connects the Redis data client.
 * Configured to return Buffers by default to handle binary canvas data.
 */
export const setupRedisDataClient = async (): Promise<RedisClientType> => {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: CONFIG.REDIS_URL,
  });

  redisClient.on('error', (err) => {
    console.error('[ERROR] Redis Data Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('[INFO] Redis Data Client connecting...');
  });

  redisClient.on('ready', () => {
    console.log('[INFO] Redis Data Client ready');
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('[ERROR] Failed to connect to Redis:', err);
    throw err;
  }
};

/**
 * Returns the connected Redis client.
 */
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis Data Client not initialized. Call setupRedisDataClient first.');
  }
  return redisClient;
};

/**
 * Gracefully closes the Redis data client connection.
 */
export const closeRedisDataClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[INFO] Redis Data Client closed');
  }
};
