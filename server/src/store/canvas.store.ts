import { CONFIG } from '../config.js';

export class CanvasStore {
  private lobbies: Map<string, { width: number; height: number; palette: string[]; data: Uint8Array }> = new Map();

  public isLobbyInMemory(lobbyName: string): boolean {
    return this.lobbies.has(lobbyName);
  }

  public getLobbyMetaData(lobbyName: string) {
    return this.lobbies.get(lobbyName);
  }

  public getLobbyPixelData(lobbyName: string): Uint8Array | undefined {
    return this.lobbies.get(lobbyName)?.data;
  }

  // Load data from DB buffer to RAM Uint8Array
  public loadLobbyToMemory(lobbyName: string, width: number, height: number, palette: string[], data: Buffer | Uint8Array): Uint8Array {
    console.log(`[CanvasStore] Loading lobby: ${lobbyName} (${width}x${height}, palette len: ${palette.length})`);
    const memoryBuffer = new Uint8Array(data);
    this.lobbies.set(lobbyName, { width, height, palette, data: memoryBuffer });
    return memoryBuffer;
  }

  public modifyPixelColor(lobbyName: string, x: number, y: number, color: number): boolean {
    const lobby = this.lobbies.get(lobbyName);
    if (!lobby) return false;

    // Validate coordinates against specific lobby dimensions
    if (x < 0 || x >= lobby.width || y < 0 || y >= lobby.height) {
      return false;
    }

    const index = y * lobby.width + x;

    // Boundary check (extra safety)
    if (index < 0 || index >= lobby.data.length) return false;

    // Optimization: only update if value changed
    if (lobby.data[index] !== color) {
      lobby.data[index] = color;
      return true;
    }
    return false;
  }

  public clearLobbyCanvas(lobbyName: string): boolean {
    const lobby = this.lobbies.get(lobbyName);
    if (!lobby) return false;
    lobby.data.fill(0); // Fill with index 0 (assumed transparent/background)
    return true;
  }

  public getInMemoryLobbyIds(): string[] {
    return Array.from(this.lobbies.keys());
  }

  public removeLobby(lobbyName: string): boolean {
    console.log(`[CanvasStore] Removing lobby from memory: ${lobbyName}`);
    return this.lobbies.delete(lobbyName);
  }
}

export const canvasStore = new CanvasStore();