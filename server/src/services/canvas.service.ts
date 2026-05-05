import { canvasStore } from '../store/canvas.store.js';
import { Lobby } from '../models/Lobby.js';
import { Canvas } from '../models/Canvas.js';

export class CanvasService {

  // Request Coalescing: Track pending loads to prevent duplicate DB fetches
  private static pendingLoads: Map<string, Promise<{ width: number; height: number; palette: string[]; data: Uint8Array }>> = new Map();

  static async getState(lobbyId: string): Promise<{ width: number; height: number; palette: string[]; data: Uint8Array }> {
    // Fast Path
    if (await canvasStore.isLobbyInMemory(lobbyId)) {
      const meta = await canvasStore.getLobbyMetaData(lobbyId);
      if (meta) {
        const data = await canvasStore.getLobbyPixelData(lobbyId);
        if (data) {
          return { width: meta.width, height: meta.height, palette: meta.palette, data };
        }
      }
    }

    // Coalescing Path
    if (this.pendingLoads.has(lobbyId)) {
      return this.pendingLoads.get(lobbyId)!;
    }

    // Slow Path
    const loadPromise = (async () => {
      try {
        const lobby = await Lobby.findById(lobbyId);
        if (!lobby) throw new Error(`Lobby '${lobbyId}' not found`);

        const canvas = await Canvas.findById(lobby.canvas);
        if (!canvas) throw new Error(`Canvas data missing for lobby '${lobbyId}'`);

        const palette = canvas.palette;
        const data = await canvasStore.loadLobbyToMemory(lobbyId, canvas.width, canvas.height, palette, canvas.data);
        return { width: canvas.width, height: canvas.height, palette, data };
      } finally {
        this.pendingLoads.delete(lobbyId);
      }
    })();

    this.pendingLoads.set(lobbyId, loadPromise);
    return loadPromise;
  }

  static async draw(lobbyId: string, x: number, y: number, color: number): Promise<boolean> {
    const changed = await canvasStore.modifyPixelColor(lobbyId, x, y, color);

    if (changed) {
      await canvasStore.markLobbyDirty(lobbyId);
    }

    return changed;
  }

  static async clearCanvas(lobbyId: string): Promise<boolean> {
    const success = await canvasStore.clearLobbyCanvas(lobbyId);
    if (success) {
      await canvasStore.markLobbyDirty(lobbyId);
    }
    return success;
  }

  static async drawBatch(lobbyId: string, pixels: { x: number, y: number, color: number }[]): Promise<{ x: number, y: number, color: number }[]> {
    const successfulUpdates: { x: number, y: number, color: number }[] = [];
    let anyChanged = false;

    for (const p of pixels) {
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number' || typeof p.color !== 'number') continue;

      const changed = await canvasStore.modifyPixelColor(lobbyId, p.x, p.y, p.color);
      if (changed) {
        // Sanitize the object we return to avoid echoing unexpected client properties
        successfulUpdates.push({ x: p.x, y: p.y, color: p.color });
        anyChanged = true;
      }
    }

    if (anyChanged) {
      await canvasStore.markLobbyDirty(lobbyId);
    }
    return successfulUpdates;
  }

  static async saveToDB(lobbyId: string): Promise<void> {
    const memoryBuffer = await canvasStore.getLobbyPixelData(lobbyId);
    if (!memoryBuffer) return;

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) return;

    await Canvas.findByIdAndUpdate(lobby.canvas, {
      data: Buffer.from(memoryBuffer),
      lastModified: new Date()
    });

    console.log(`[CanvasService] Saved lobby '${lobbyId}' to DB`);
  }

  static async unloadLobby(lobbyId: string): Promise<void> {
    if (!(await canvasStore.isLobbyInMemory(lobbyId))) return;

    console.log(`[CanvasService] Unloading idle lobby: ${lobbyId}`);

    await this.saveToDB(lobbyId);
    await canvasStore.removeLobby(lobbyId);
  }
}