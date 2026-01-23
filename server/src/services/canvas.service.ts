import { canvasStore } from '../store/canvas.store';
import { Lobby } from '../models/Lobby';
import { Canvas } from '../models/Canvas';
import { CONFIG } from '../config';

export class CanvasService {

  /**
   * Retrieves the current pixel state.
   * If not in RAM, fetches from DB and hydrates the Store.
   */
  static async getState(lobbyName: string): Promise<Uint8Array> {
    // 1. Hot Storage (RAM)
    if (canvasStore.isLobbyInMemory(lobbyName)) {
      return canvasStore.getLobbyPixelData(lobbyName)!;
    }

    // 2. Cold Storage (DB)
    const lobby = await Lobby.findOne({ name: lobbyName });
    if (!lobby) throw new Error(`Lobby '${lobbyName}' not found`);

    const canvas = await Canvas.findById(lobby.canvas);
    if (!canvas) throw new Error(`Canvas data missing for lobby '${lobbyName}'`);

    // 3. Hydrate RAM
    return canvasStore.loadLobbyToMemory(lobbyName, canvas.data);
  }

  /**
   * Updates a pixel in RAM.
   * Returns true if the pixel actually changed.
   */
  static draw(lobbyName: string, x: number, y: number, color: number) {
    if (x < 0 || x >= CONFIG.CANVAS.WIDTH || y < 0 || y >= CONFIG.CANVAS.HEIGHT) {
      return false;
    }

    const index = y * CONFIG.CANVAS.WIDTH + x;
    return canvasStore.modifyPixelColor(lobbyName, index, color);
  }

  /**
   * Persists the current RAM state to MongoDB.
   */
  static async saveToDB(lobbyName: string) {
    const memoryBuffer = canvasStore.getLobbyPixelData(lobbyName);
    if (!memoryBuffer) return; // Nothing to save

    const lobby = await Lobby.findOne({ name: lobbyName });
    if (!lobby) return;

    // Convert Uint8Array back to Node Buffer for Mongoose
    const dataBuffer = Buffer.from(memoryBuffer);

    await Canvas.findByIdAndUpdate(lobby.canvas, {
      data: dataBuffer,
      lastModified: new Date()
    });

    console.log(`[CanvasService] Saved lobby '${lobbyName}' to DB`);
  }
}