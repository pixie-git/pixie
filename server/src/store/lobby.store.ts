import { CONFIG } from '../config.js';

/**
 * LobbyStore
 * Manages the "Hot Storage" (RAM) for all active lobbies.
 * Singleton pattern ensures we share the same state across the app.
 */
export class LobbyStore {
  private lobbies: Map<string, Uint8Array> = new Map();

  public getLobbyBuffer(lobbyId: string): Uint8Array {
    return this.lobbies.get(lobbyId) ?? this.createLobby(lobbyId);
  }

  private createLobby(lobbyId: string): Uint8Array {
    console.log(`[LobbyStore] Initializing new RAM buffer for lobby: ${lobbyId}`);
    const size = CONFIG.CANVAS.WIDTH * CONFIG.CANVAS.HEIGHT;
    const buffer = new Uint8Array(size);
    this.lobbies.set(lobbyId, buffer);
    return buffer;
  }

  public setPixel(lobbyId: string, index: number, color: number): boolean {
    const buffer = this.getLobbyBuffer(lobbyId);

    if (index < 0 || index >= buffer.length) return false;

    if (buffer[index] !== color) {
      buffer[index] = color;
      return true;
    }
    return false;
  }
}

export const lobbyStore = new LobbyStore();