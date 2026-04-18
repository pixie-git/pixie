import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import { setupTestMocks, createTestServer, createAndJoinClient, mockLobbyId, tokenA, tokenB } from './utils/socket-test-utils.js';

describe('Socket Broadcasting Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    setupTestMocks();

    const testSetup = await createTestServer();
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;
  });

  afterAll(() => {
    io.close();
    httpServer.close();
    vi.restoreAllMocks();
  });

  it('should broadcast DRAW event from Client A as PIXEL_UPDATE to Client B', async () => {
    const clientA = await createAndJoinClient(port, tokenA);
    const clientB = await createAndJoinClient(port, tokenB);

    // Wait for B to receive PIXEL_UPDATE
    const drawData = { lobbyId: mockLobbyId, x: 10, y: 20, color: 1 };
    
    return new Promise<void>((resolve) => {
      clientB.on(CONFIG.EVENTS.SERVER.PIXEL_UPDATE, (data) => {
        expect(data).toEqual({ x: 10, y: 20, color: 1 });
        clientA.close();
        clientB.close();
        resolve();
      });

      clientA.emit(CONFIG.EVENTS.CLIENT.DRAW, drawData);
    });
  });

  it('should broadcast DRAW_BATCH event from Client A as PIXEL_UPDATE_BATCH to Client B', async () => {
    const clientA = await createAndJoinClient(port, tokenA);
    const clientB = await createAndJoinClient(port, tokenB);

    const batchData = {
      lobbyId: mockLobbyId,
      pixels: [
        { x: 1, y: 1, color: 2 },
        { x: 2, y: 2, color: 3 }
      ]
    };

    return new Promise<void>((resolve) => {
      clientB.on(CONFIG.EVENTS.SERVER.PIXEL_UPDATE_BATCH, (data) => {
        expect(data.pixels).toEqual(batchData.pixels);
        clientA.close();
        clientB.close();
        resolve();
      });

      clientA.emit(CONFIG.EVENTS.CLIENT.DRAW_BATCH, batchData);
    });
  });
});
