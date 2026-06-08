import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import { createAndJoinClient, tokenA, tokenB, teardownTestServer, bootstrapTestServer, setupTestLobby } from './utils/socket-test-utils.js';

describe('Socket Broadcasting Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    const testSetup = await bootstrapTestServer();
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should broadcast DRAW event from Client A as PIXEL_UPDATE to Client B', async () => {
    const lobbyId = new mongoose.Types.ObjectId().toString();
    await setupTestLobby(lobbyId);
    
    const clientA = await createAndJoinClient(port, tokenA, lobbyId);
    const clientB = await createAndJoinClient(port, tokenB, lobbyId);

    const drawData = { lobbyId, x: 10, y: 20, color: 1 };
    
    try {
      const updatePromise = new Promise<void>((resolve) => {
        clientB.on(CONFIG.EVENTS.SERVER.PIXEL_UPDATE, (data) => {
          expect(data).toEqual({ x: 10, y: 20, color: 1 });
          resolve();
        });
      });

      clientA.emit(CONFIG.EVENTS.CLIENT.DRAW, drawData);
      await updatePromise;
    } finally {
      clientA.close();
      clientB.close();
    }
  });

  it('should broadcast DRAW_BATCH event from Client A as PIXEL_UPDATE_BATCH to Client B', async () => {
    const lobbyId = new mongoose.Types.ObjectId().toString();
    await setupTestLobby(lobbyId);

    const clientA = await createAndJoinClient(port, tokenA, lobbyId);
    const clientB = await createAndJoinClient(port, tokenB, lobbyId);

    const batchData = {
      lobbyId,
      pixels: [
        { x: 1, y: 1, color: 2 },
        { x: 2, y: 2, color: 3 }
      ]
    };

    try {
      const updatePromise = new Promise<void>((resolve) => {
        clientB.on(CONFIG.EVENTS.SERVER.PIXEL_UPDATE_BATCH, (data) => {
          expect(data.pixels).toEqual(batchData.pixels);
          resolve();
        });
      });

      clientA.emit(CONFIG.EVENTS.CLIENT.DRAW_BATCH, batchData);
      await updatePromise;
    } finally {
      clientA.close();
      clientB.close();
    }
  });
});
