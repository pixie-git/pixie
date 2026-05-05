import crypto from 'crypto';
import { getRedisClient } from '../db/redis.js';
import { canvasStore } from '../store/canvas.store.js';
import { CanvasService } from './canvas.service.js';
import { CONFIG } from '../config.js';

export class CoordinationService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static readonly instanceId = process.env.SERVER_ID || crypto.randomUUID();

  /**
   * Starts the background worker to flush dirty lobbies to MongoDB.
   * Runs repeatedly based on the configured flush interval.
   */
  static startFlushWorker(): void {
    if (this.intervalId) {
      console.warn('[CoordinationService] Flush worker is already running.');
      return;
    }

    console.log(`[CoordinationService] Starting flush worker (Instance: ${this.instanceId})`);
    this.intervalId = setInterval(
      () => this.flushDirtyLobbies(),
      CONFIG.PERSISTENCE.FLUSH_INTERVAL_MS
    );
  }

  /**
   * Stops the background flush worker gracefully.
   */
  static stopFlushWorker(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[CoordinationService] Stopped flush worker.');
    }
  }

  /**
   * Acquires a distributed lock and flushes all pending dirty canvases to the database.
   */
  static async flushDirtyLobbies(): Promise<void> {
    const redis = getRedisClient();
    const { LOCK_KEY, LOCK_TTL_MS } = CONFIG.PERSISTENCE;

    // 1. Attempt to acquire the distributed lock
    const acquired = await redis.set(LOCK_KEY, this.instanceId, {
      NX: true,
      PX: LOCK_TTL_MS
    });

    if (!acquired) {
      // Another instance holds the lock, do nothing
      return;
    }

    try {
      // 2. Fetch all currently dirty lobbies
      const dirtyLobbies = await canvasStore.getDirtyLobbies();

      if (dirtyLobbies.length === 0) {
        return;
      }

      console.log(`[CoordinationService] Instance ${this.instanceId} acquired lock. Flushing ${dirtyLobbies.length} dirty lobbies...`);

      // 3. Process each dirty lobby
      for (const lobbyId of dirtyLobbies) {
        try {
          await CanvasService.saveToDB(lobbyId);
          await canvasStore.removeLobbyFromDirty(lobbyId);
        } catch (error) {
          console.error(`[CoordinationService] Failed to save lobby '${lobbyId}':`, error);
          // Do not remove from dirty queue if saving fails, let the next cycle retry
        }
      }
    } catch (error) {
      console.error(`[CoordinationService] Error during flush process:`, error);
    } finally {
      // 4. Release the lock safely using a Lua script
      const unlockScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
      `;

      try {
        await redis.eval(unlockScript, {
          keys: [LOCK_KEY],
          arguments: [this.instanceId]
        });
      } catch (error) {
        console.error(`[CoordinationService] Failed to release lock safely:`, error);
      }
    }
  }
}
