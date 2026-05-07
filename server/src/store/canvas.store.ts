import { getRedisClient } from '../db/redis.js';

export interface LobbyMeta {
  width: number;
  height: number;
  paletteLen: number;
}

export class CanvasStore {
  private getMetaKey(lobbyId: string): string {
    return `lobby:${lobbyId}:meta`;
  }

  private getCanvasKey(lobbyId: string): string {
    return `lobby:${lobbyId}:canvas`;
  }

  public async isLobbyInMemory(lobbyId: string): Promise<boolean> {
    const redis = getRedisClient();
    return (await redis.exists(this.getMetaKey(lobbyId))) === 1;
  }

  public async getLobbyMetaData(lobbyId: string): Promise<(LobbyMeta & { palette: string[] }) | undefined> {
    const redis = getRedisClient();
    const meta = await redis.hGetAll(this.getMetaKey(lobbyId));
    if (!meta || Object.keys(meta).length === 0) return undefined;

    const palette = JSON.parse(meta.palette) as string[];
    return {
      width: parseInt(meta.width, 10),
      height: parseInt(meta.height, 10),
      palette,
      paletteLen: meta.paletteLen ? parseInt(meta.paletteLen, 10) : palette.length,
    };
  }

  public async getLobbyPixelData(lobbyId: string): Promise<Uint8Array | undefined> {
    const redis = getRedisClient();
    const data = await redis.get(this.getCanvasKey(lobbyId));
    if (!data) return undefined;
    return new Uint8Array(Buffer.from(data, 'latin1'));
  }

  // Load data from DB buffer to Redis
  public async loadLobbyToMemory(
    lobbyId: string,
    width: number,
    height: number,
    palette: string[],
    data: Buffer | Uint8Array
  ): Promise<Uint8Array> {
    console.log(`[CanvasStore] Loading lobby to Redis: ${lobbyId} (${width}x${height})`);
    const redis = getRedisClient();
    const metaKey = this.getMetaKey(lobbyId);
    const canvasKey = this.getCanvasKey(lobbyId);

    await Promise.all([
      redis.hSet(metaKey, {
        width: width.toString(),
        height: height.toString(),
        palette: JSON.stringify(palette),
        paletteLen: palette.length.toString(),
      }),
      redis.set(canvasKey, Buffer.from(data)),
    ]);

    return new Uint8Array(data);
  }

  /**
   * Modifies a single pixel. 
   * @param meta Optional cached metadata to avoid redundant Redis roundtrips in batch operations.
   */
  public async modifyPixelColor(
    lobbyId: string,
    x: number,
    y: number,
    color: number,
    meta?: LobbyMeta
  ): Promise<boolean> {
    const redis = getRedisClient();

    let width: number, height: number, paletteLen: number;

    if (meta) {
      width = meta.width;
      height = meta.height;
      paletteLen = meta.paletteLen;
    } else {
      const metaArr = await redis.hmGet(this.getMetaKey(lobbyId), ['width', 'height', 'paletteLen']);
      if (!metaArr[0] || !metaArr[1] || !metaArr[2]) return false;
      width = parseInt(metaArr[0], 10);
      height = parseInt(metaArr[1], 10);
      paletteLen = parseInt(metaArr[2], 10);
    }

    if (x < 0 || x >= width || y < 0 || y >= height || color < 0 || color >= paletteLen) {
      return false;
    }

    const index = y * width + x;
    const canvasKey = this.getCanvasKey(lobbyId);

    // Optimization: Only update and mark dirty if the color actually changed
    const current = await redis.getRange(canvasKey, index, index);
    const currentColor = Buffer.isBuffer(current) ? current[0] : (current as string)?.charCodeAt(0);
    if (current && current.length > 0 && currentColor === color) {
      return false;
    }

    await redis.setRange(canvasKey, index, Buffer.from([color]));
    return true;
  }

  public async modifyPixelBatch(
    lobbyId: string,
    pixels: { x: number; y: number; color: number }[],
    meta: LobbyMeta
  ): Promise<{ x: number; y: number; color: number }[]> {
    const redis = getRedisClient();
    const { width, height, paletteLen } = meta;
    const canvasKey = this.getCanvasKey(lobbyId);

    const successfulUpdates: { x: number; y: number; color: number }[] = [];

    // First, fetch current colors to filter redundant writes
    const pipeline = redis.multi();
    const validPixels: { x: number; y: number; color: number; index: number }[] = [];

    for (const p of pixels) {
      if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height || p.color < 0 || p.color >= paletteLen) continue;
      const index = p.y * width + p.x;
      validPixels.push({ ...p, index });
      pipeline.getRange(canvasKey, index, index);
    }

    if (validPixels.length === 0) return [];

    const currentColors = await pipeline.exec() as unknown as string[];

    // Second, batch updates for pixels that actually changed
    const writePipeline = redis.multi();
    const finalUpdates: typeof successfulUpdates = [];

    for (let i = 0; i < validPixels.length; i++) {
      const p = validPixels[i];
      const current = currentColors[i];
      const currentColor = Buffer.isBuffer(current) ? current[0] : (current as string)?.charCodeAt(0);
      
      if (current && current.length > 0 && currentColor === p.color) continue;

      writePipeline.setRange(canvasKey, p.index, Buffer.from([p.color]));
      finalUpdates.push({ x: p.x, y: p.y, color: p.color });
    }

    if (finalUpdates.length > 0) {
      await writePipeline.exec();
    }

    return finalUpdates;
  }

  public async clearLobbyCanvas(lobbyId: string): Promise<boolean> {
    const redis = getRedisClient();

    const metaArr = await redis.hmGet(this.getMetaKey(lobbyId), ['width', 'height']);
    if (!metaArr[0] || !metaArr[1]) return false;

    const width = parseInt(metaArr[0], 10);
    const height = parseInt(metaArr[1], 10);
    const size = width * height;
    const emptyData = Buffer.alloc(size, 0);

    await redis.set(this.getCanvasKey(lobbyId), emptyData);
    return true;
  }

  public async getInMemoryLobbyIds(): Promise<string[]> {
    const redis = getRedisClient();
    const keys = await redis.keys('lobby:*:meta');
    return keys.map((key) => key.split(':')[1]);
  }

  public async removeLobby(lobbyId: string): Promise<boolean> {
    console.log(`[CanvasStore] Removing lobby from Redis: ${lobbyId}`);
    const redis = getRedisClient();
    const deleted = await redis.del([this.getMetaKey(lobbyId), this.getCanvasKey(lobbyId)]);
    return deleted > 0;
  }

  public async markLobbyDirty(lobbyId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.sAdd('lobbies:dirty', lobbyId);
  }

  public async getDirtyLobbies(): Promise<string[]> {
    const redis = getRedisClient();
    return await redis.sMembers('lobbies:dirty');
  }

  public async removeLobbyFromDirty(lobbyId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.sRem('lobbies:dirty', lobbyId);
  }
}

export const canvasStore = new CanvasStore();