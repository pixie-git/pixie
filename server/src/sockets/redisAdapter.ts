import { createClient, RedisClientType } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { CONFIG } from '../config.js';

let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;
let adapterPromise: Promise<any> | null = null;

/**
 * Initializes Redis pub/sub clients and returns the Socket.io Redis adapter.
 */
export const setupRedisAdapter = async () => {
  if (pubClient && subClient) {
    return createAdapter(pubClient, subClient);
  }
  if (adapterPromise) return adapterPromise;

  adapterPromise = (async () => {
    const pClient = createClient({ url: CONFIG.REDIS_URL });
    const sClient = pClient.duplicate();

    pClient.on('error', (err) => console.error('[ERROR] Redis Pub Client Error:', err));
    sClient.on('error', (err) => console.error('[ERROR] Redis Sub Client Error:', err));

    try {
      await Promise.all([pClient.connect(), sClient.connect()]);
      console.log('[INFO] Redis Adapter pub/sub clients connected');
      pubClient = pClient;
      subClient = sClient;
      return createAdapter(pubClient, subClient);
    } catch (err) {
      console.error('[ERROR] Failed to connect Redis Adapter clients:', err);
      pubClient = null;
      subClient = null;
      throw err;
    } finally {
      adapterPromise = null;
    }
  })();

  return adapterPromise;
};

/**
 * Returns the Redis publish client.
 * Throws an error if not initialized.
 */
export const getPubClient = (): RedisClientType => {
  if (!pubClient) {
    throw new Error('Redis Pub Client not initialized. Call setupRedisAdapter first.');
  }
  return pubClient as RedisClientType;
};

/**
 * Returns the Redis subscribe client.
 * Throws an error if not initialized.
 */
export const getSubClient = (): RedisClientType => {
  if (!subClient) {
    throw new Error('Redis Sub Client not initialized. Call setupRedisAdapter first.');
  }
  return subClient as RedisClientType;
};

/**
 * Gracefully closes the Redis pub/sub clients.
 */
export const closeRedisAdapterClients = async (): Promise<void> => {
  try {
    const promises = [];
    if (pubClient) {
      promises.push(pubClient.quit());
      pubClient = null;
    }
    if (subClient) {
      promises.push(subClient.quit());
      subClient = null;
    }
    await Promise.all(promises);
    if (promises.length > 0) {
      console.log('[INFO] Redis Adapter pub/sub clients closed');
    }
  } catch (err) {
    console.error('[ERROR] Error closing Redis Adapter clients:', err);
  }
};
