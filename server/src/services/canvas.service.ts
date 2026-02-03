import { canvasStore } from '../store/canvas.store.js';
import { Lobby } from '../models/Lobby.js';
import { Canvas } from '../models/Canvas.js';
import { CONFIG } from '../config.js';

export class CanvasService {

  // Request Coalescing: Track pending loads to prevent duplicate DB fetches
  private static pendingLoads: Map<string, Promise<{ width: number; height: number; palette: string[]; data: Uint8Array }>> = new Map();

  // Write-Behind: Track active save timers for each lobby
  private static saveTimers: Map<string, NodeJS.Timeout> = new Map();

  // Retrieves pixel state from memory, loading from DB if necessary
  static async getState(lobbyName: string): Promise<{ width: number; height: number; palette: string[]; data: Uint8Array }> {
    // 1. Fast Path: Already in memory
    if (canvasStore.isLobbyInMemory(lobbyName)) {
      const meta = canvasStore.getLobbyMetaData(lobbyName)!;
      return { width: meta.width, height: meta.height, palette: meta.palette, data: meta.data };
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

        // Load with dimensions and palette
        const palette = canvas.palette; // Palette is now an array on Canvas
        const data = canvasStore.loadLobbyToMemory(lobbyName, canvas.width, canvas.height, palette, canvas.data);
        return { width: canvas.width, height: canvas.height, palette, data };
      } finally {
        // Cleanup promise when done (success or failure)
        this.pendingLoads.delete(lobbyName);
      }
    })();

    this.pendingLoads.set(lobbyName, loadPromise);
    return loadPromise;
  }

  // Updates a pixel in memory (validation handled by store now)
  static draw(lobbyName: string, x: number, y: number, color: number) {
    const changed = canvasStore.modifyPixelColor(lobbyName, x, y, color);

    if (changed) {
      this.scheduleSave(lobbyName);
    }

    return changed;
  }

  // Schedules a DB save if one isn't already pending
  private static scheduleSave(lobbyName: string) {
    if (this.saveTimers.has(lobbyName)) {
      return; // Timer already running, pending save will catch this change
    }

    // Start a new 2-second timer
    const timer = setTimeout(() => {
      this.saveToDB(lobbyName);
    }, 2000);

    this.saveTimers.set(lobbyName, timer);
  }

  // Persists the current in-memory state to the database
  static async saveToDB(lobbyName: string) {
    // Remove timer from map first, so new changes can schedule a new save
    this.saveTimers.delete(lobbyName);

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