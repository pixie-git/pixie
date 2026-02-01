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
  static async getState(lobbyId: string): Promise<{ width: number; height: number; palette: string[]; data: Uint8Array }> {
    // 1. Fast Path: Already in memory
    if (canvasStore.isLobbyInMemory(lobbyId)) {
      const meta = canvasStore.getLobbyMetaData(lobbyId)!;
      return { width: meta.width, height: meta.height, palette: meta.palette, data: meta.data };
    }

    // 2. Coalescing Path: Already loading, wait for existing promise
    if (this.pendingLoads.has(lobbyId)) {
      return this.pendingLoads.get(lobbyId)!;
    }

    // 3. Slow Path: Fetch from DB
    const loadPromise = (async () => {
      try {
        const lobby = await Lobby.findById(lobbyId);
        if (!lobby) throw new Error(`Lobby '${lobbyId}' not found`);

        const canvas = await Canvas.findById(lobby.canvas);
        if (!canvas) throw new Error(`Canvas data missing for lobby '${lobbyId}'`);

        // Load with dimensions and palette
        const palette = canvas.palette; // Palette is now an array on Canvas
        const data = canvasStore.loadLobbyToMemory(lobbyId, canvas.width, canvas.height, palette, canvas.data);
        return { width: canvas.width, height: canvas.height, palette, data };
      } finally {
        // Cleanup promise when done (success or failure)
        this.pendingLoads.delete(lobbyId);
      }
    })();

    this.pendingLoads.set(lobbyId, loadPromise);
    return loadPromise;
  }

  // Updates a pixel in memory (validation handled by store now)
  static draw(lobbyId: string, x: number, y: number, color: number) {
    const changed = canvasStore.modifyPixelColor(lobbyId, x, y, color);

    if (changed) {
      this.scheduleSave(lobbyId);
    }

    return changed;
  }

  static clearCanvas(lobbyId: string): boolean {
    const success = canvasStore.clearLobbyCanvas(lobbyId);
    if (success) {
      this.scheduleSave(lobbyId);
    }
    return success;
  }

  // Updates multiple pixels
  static drawBatch(lobbyId: string, pixels: { x: number, y: number, color: number }[]): { x: number, y: number, color: number }[] {
    const successfulUpdates: { x: number, y: number, color: number }[] = [];
    let anyChanged = false;

    for (const p of pixels) {
      // Basic validation
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number' || typeof p.color !== 'number') continue;

      const changed = canvasStore.modifyPixelColor(lobbyId, p.x, p.y, p.color);
      if (changed) {
        // Sanitize the object we return to avoid echoing unexpected client properties
        successfulUpdates.push({ x: p.x, y: p.y, color: p.color });
        anyChanged = true;
      }
    }

    if (anyChanged) this.scheduleSave(lobbyId);
    return successfulUpdates;
  }

  // Schedules a DB save if one isn't already pending
  private static scheduleSave(lobbyId: string) {
    if (this.saveTimers.has(lobbyId)) {
      return; // Timer already running, pending save will catch this change
    }

    // Start a new 2-second timer
    const timer = setTimeout(() => {
      this.saveToDB(lobbyId);
    }, 2000);

    this.saveTimers.set(lobbyId, timer);
  }

  // Persists the current in-memory state to the database
  static async saveToDB(lobbyId: string) {
    // Remove timer from map first, so new changes can schedule a new save
    this.saveTimers.delete(lobbyId);

    const memoryBuffer = canvasStore.getLobbyPixelData(lobbyId);
    if (!memoryBuffer) return;

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) return;

    await Canvas.findByIdAndUpdate(lobby.canvas, {
      data: Buffer.from(memoryBuffer),
      lastModified: new Date()
    });

    console.log(`[CanvasService] Saved lobby '${lobbyId}' to DB`);
  }

  // Unloads a lobby from memory, persisting it first
  static async unloadLobby(lobbyId: string) {
    if (!canvasStore.isLobbyInMemory(lobbyId)) return;

    console.log(`[CanvasService] Unloading idle lobby: ${lobbyId}`);

    // If there's a pending save timer, cancel it and save immediately
    if (this.saveTimers.has(lobbyId)) {
      clearTimeout(this.saveTimers.get(lobbyId));
      this.saveTimers.delete(lobbyId);
    }

    // Force strict save
    await this.saveToDB(lobbyId);

    // Remove from memory
    canvasStore.removeLobby(lobbyId);
  }
}