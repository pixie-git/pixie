import { canvasStore } from '../store/canvas.store';
import { Lobby } from '../models/Lobby';
import { Canvas } from '../models/Canvas';
import { CONFIG } from '../config';

export class CanvasService {

  // Request Coalescing: Track pending loads to prevent duplicate DB fetches
  private static pendingLoads: Map<string, Promise<Uint8Array>> = new Map();

  // Retrieves pixel state from memory, loading from DB if necessary
  static async getState(lobbyName: string): Promise<Uint8Array> {
    // 1. Fast Path: Already in memory
    if (canvasStore.isLobbyInMemory(lobbyName)) {
      return canvasStore.getLobbyPixelData(lobbyName)!;
    }

    // 2. Coalescing Path: Already loading, wait for existing promise
    if (this.pendingLoads.has(lobbyName)) {
      return this.pendingLoads.get(lobbyName)!;
    }

    // 3. Slow Path: Fetch from DB
    const loadPromise = (async () => {
      try {
        const lobby = await Lobby.findOne({ name: lobbyName });
        if (!lobby) throw new Error(`Lobby '${lobbyName}' not found`);

        const canvas = await Canvas.findById(lobby.canvas);
        if (!canvas) throw new Error(`Canvas data missing for lobby '${lobbyName}'`);

        return canvasStore.loadLobbyToMemory(lobbyName, canvas.data);
      } finally {
        // Cleanup promise when done (success or failure)
        this.pendingLoads.delete(lobbyName);
      }
    })();

    this.pendingLoads.set(lobbyName, loadPromise);
    return loadPromise;
  }

  // Updates a pixel in memory if coordinates are valid
  static draw(lobbyName: string, x: number, y: number, color: number) {
    if (x < 0 || x >= CONFIG.CANVAS.WIDTH || y < 0 || y >= CONFIG.CANVAS.HEIGHT) {
      return false;
    }

    const index = y * CONFIG.CANVAS.WIDTH + x;
    return canvasStore.modifyPixelColor(lobbyName, index, color);
  }

  // Persists the current in-memory state to the database
  static async saveToDB(lobbyName: string) {
    const memoryBuffer = canvasStore.getLobbyPixelData(lobbyName);
    if (!memoryBuffer) return;

    const lobby = await Lobby.findOne({ name: lobbyName });
    if (!lobby) return;

    await Canvas.findByIdAndUpdate(lobby.canvas, {
      data: Buffer.from(memoryBuffer),
      lastModified: new Date()
    });

    console.log(`[CanvasService] Saved lobby '${lobbyName}' to DB`);
  }
}