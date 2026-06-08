import { createClient, RedisClientType } from 'redis';
import { CONFIG } from '../config.js';

let redisClient: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;

/**
 * Initializes and connects the Redis data client.
 * Configured to return Buffers by default to handle binary canvas data.
 */
export const setupRedisDataClient = async (): Promise<RedisClientType> => {
  if (redisClient) return redisClient;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const client = createClient({
      url: CONFIG.REDIS_URL,
    });

    client.on('error', (err) => {
      console.error('[ERROR] Redis Data Client Error:', err);
    });

    client.on('connect', () => {
      console.log('[INFO] Redis Data Client connecting...');
    });

    client.on('ready', () => {
      console.log('[INFO] Redis Data Client ready');
    });

    try {
      await client.connect();
      redisClient = client;
      return client;
    } catch (err) {
      console.error('[ERROR] Failed to connect to Redis:', err);
      throw err;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
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
