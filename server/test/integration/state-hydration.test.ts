import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import {
  createClient,
  createAndJoinClient,
  mockLobbyId,
  tokenA,
  tokenB,
  teardownTestServer,
  bootstrapTestServer,
  setupTestLobby,
  userA
} from './utils/socket-test-utils.js';

describe('Initial State Hydration Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  const canvasWidth = 64;
  const canvasHeight = 64;

  beforeAll(async () => {
    const testSetup = await bootstrapTestServer();
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;
  });

  beforeEach(async () => {
    await setupTestLobby(mockLobbyId, canvasWidth, canvasHeight);
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should hydrate a new client with pixels drawn by a previous client', async () => {
    const clientA = await createAndJoinClient(port, tokenA);

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

    const clientB = await createClient(port, tokenB);
    const state: any = await new Promise((resolve) => {
      clientB.once(CONFIG.EVENTS.SERVER.INIT_STATE, (state) => resolve(state));
      clientB.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, mockLobbyId);
    });

    expect(state.width).toBe(canvasWidth);
    expect(state.height).toBe(canvasHeight);
    
    const pixelData = new Uint8Array(state.data);
    const index = y * canvasWidth + x;
    expect(pixelData[index]).toBe(color);

    await new Promise<void>((resolve) => {
      clientB.once(CONFIG.EVENTS.SERVER.USER_LEFT, (user) => {
        expect(user.id).toBe(userA.id);
        resolve();
      });
      clientA.disconnect();
    });

    clientB.disconnect();
  });
});
