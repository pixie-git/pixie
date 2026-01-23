import { CONFIG } from '../config';

export class CanvasStore {
  private buffers: Map<string, Uint8Array> = new Map();

  public isLobbyInMemory(lobbyId: string): boolean {
    return this.buffers.has(lobbyId);
  }

  public getLobbyPixelData(lobbyId: string): Uint8Array | undefined {
    return this.buffers.get(lobbyId);
  }

  // Load data from DB buffer to RAM Uint8Array
  public loadLobbyToMemory(lobbyId: string, data: Buffer | Uint8Array): Uint8Array {
    console.log(`[CanvasStore] Loading lobby: ${lobbyId}`);
    const memoryBuffer = new Uint8Array(data);
    this.buffers.set(lobbyId, memoryBuffer);
    return memoryBuffer;
  }

  public modifyPixelColor(lobbyId: string, index: number, color: number): boolean {
    const buffer = this.buffers.get(lobbyId);
    if (!buffer) return false;

    // Boundary check
    if (index < 0 || index >= buffer.length) return false;

    // Optimization: only update if value changed
    if (buffer[index] !== color) {
      buffer[index] = color;
      return true;
    }
    return false;
  }

  public getInMemoryLobbyIds(): string[] {
    return Array.from(this.buffers.keys());
  }
}

export const canvasStore = new CanvasStore();