import { CONFIG } from '../config';

export class CanvasStore {
  private buffers: Map<string, Uint8Array> = new Map();

  public isLobbyInMemory(lobbyName: string): boolean {
    return this.buffers.has(lobbyName);
  }

  public getLobbyPixelData(lobbyName: string): Uint8Array | undefined {
    return this.buffers.get(lobbyName);
  }

  // Load data from DB buffer to RAM Uint8Array
  public loadLobbyToMemory(lobbyName: string, data: Buffer | Uint8Array): Uint8Array {
    console.log(`[CanvasStore] Loading lobby: ${lobbyName}`);
    const memoryBuffer = new Uint8Array(data);
    this.buffers.set(lobbyName, memoryBuffer);
    return memoryBuffer;
  }

  public modifyPixelColor(lobbyName: string, index: number, color: number): boolean {
    const buffer = this.buffers.get(lobbyName);
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