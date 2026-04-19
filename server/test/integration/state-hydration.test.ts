import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import { CanvasService } from '../../src/services/canvas.service.js';
import { canvasStore } from '../../src/store/canvas.store.js';
import { createClient, createAndJoinClient, mockLobbyId, tokenA, tokenB, teardownTestServer, bootstrapTestServer } from './utils/socket-test-utils.js';

describe('Initial State Hydration Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  const canvasWidth = 64;
  const canvasHeight = 64;
  const palette = ['#000000', '#FFFFFF'];

  beforeAll(async () => {
    const testSetup = await bootstrapTestServer();
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;

    // Override CanvasService.saveToDB to avoid DB errors (KISS)
    vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined);

    // Pre-load the lobby into memory with specific dimensions for this test
    const initialData = new Uint8Array(canvasWidth * canvasHeight).fill(0);
    canvasStore.loadLobbyToMemory(mockLobbyId, canvasWidth, canvasHeight, palette, initialData);
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
    canvasStore.removeLobby(mockLobbyId);
  });

  it('should hydrate a new client with pixels drawn by a previous client', async () => {
    // 1. Connect Client A and join lobby
    const clientA = await createAndJoinClient(port, tokenA);

    // 2. Client A draws a pixel at (10, 10) with color 1
    const x = 10;
    const y = 10;
    const color = 1;
    
    await new Promise<void>((resolve) => {
      clientA.once(CONFIG.EVENTS.SERVER.PIXEL_UPDATE, (data) => {
        expect(data).toEqual({ x, y, color });
        resolve();
      });
      clientA.emit(CONFIG.EVENTS.CLIENT.DRAW, { lobbyId: mockLobbyId, x, y, color });
    });

    // 3. Connect Client B and join the same lobby (before A disconnects)
    const clientB = await createClient(port, tokenB);
    const state: any = await new Promise((resolve) => {
      clientB.once(CONFIG.EVENTS.SERVER.INIT_STATE, (state) => resolve(state));
      clientB.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, mockLobbyId);
    });

    // 4. Assertion: Client B receives the INIT_STATE with the pixel at (10, 10) as color 1
    expect(state.width).toBe(canvasWidth);
    expect(state.height).toBe(canvasHeight);
    
    const pixelData = new Uint8Array(state.data);
    const index = y * canvasWidth + x;
    expect(pixelData[index]).toBe(color);

    // 5. Client A disconnects and Client B waits for USER_LEFT signal
    await new Promise<void>((resolve) => {
      clientB.once(CONFIG.EVENTS.SERVER.USER_LEFT, (user) => {
        expect(user.id).toBe('user-a'); // from userA in utils
        resolve();
      });
      clientA.disconnect();
    });

    // 6. Final cleanup: Client B disconnects, emptying the lobby and triggering real unloadLobby
    clientB.disconnect();
  });
});

