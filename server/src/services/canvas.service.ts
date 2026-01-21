import { lobbyStore } from '../store/lobby.store';
import { CONFIG } from '../config';

export class CanvasService {

  static getLobbyState(lobbyId: string): Uint8Array {
    return lobbyStore.getLobbyBuffer(lobbyId);
  }

  static drawPixel(lobbyId: string, x: number, y: number, color: number) {
    if (x < 0 || x >= CONFIG.CANVAS.WIDTH || y < 0 || y >= CONFIG.CANVAS.HEIGHT) {
      console.warn(`[CanvasService] Out of bounds draw attempt: ${x}, ${y}`);
      return null;
    }

    const index = y * CONFIG.CANVAS.WIDTH + x;

    const hasChanged = lobbyStore.setPixel(lobbyId, index, color);

    if (hasChanged) {
      return { x, y, color };
    }

    return null;
  }
}