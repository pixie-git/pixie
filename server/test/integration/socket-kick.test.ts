import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import { CONFIG } from '../../src/config.js';
import { LobbyController } from '../../src/controllers/lobby.controller.js';
import { DISCONNECT_REASONS } from '../../src/constants/disconnect.constants.js';
import {
  createAndJoinClient,
  mockLobbyId,
  tokenA,
  tokenB,
  userB,
  userA,
  teardownTestServer,
  setupTestMocks,
  setupTestLobby
} from './utils/socket-test-utils.js';
import { setupSocket } from '../../src/sockets/index.js';

describe('Kick User Flow Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    setupTestMocks();

    const app = express();
    app.use(express.json());

    httpServer = createServer(app);
    io = new Server(httpServer);
    setupSocket(io);

    // Attach IO and mock owner auth so that we bypass requireLobbyOwner and authenticateToken issues
    app.use((req, res, next) => {
      (req as any).io = io;
      (req as any).user = userA; // owner
      next();
    });

    app.post('/api/lobbies/:id/kick', LobbyController.kickUser);

    await new Promise<void>((resolve, reject) => {
      httpServer.listen(() => {
        const address = httpServer.address();
        if (!address || typeof address === 'string') {
          return reject(new Error('Failed to gracefully acquire a port number for the test server.'));
        }
        port = address.port;
        resolve();
      });
    });
  });

  beforeEach(() => {
    setupTestLobby();
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should disconnect the target user, notify others, and allow reconnection', async () => {
    const ownerClient = await createAndJoinClient(port, tokenA);
    const targetClient = await createAndJoinClient(port, tokenB);

    await new Promise(resolve => setTimeout(resolve, 50));

    const forceDisconnectPromise = new Promise<void>((resolve) => {
      targetClient.on(CONFIG.EVENTS.SERVER.FORCE_DISCONNECT, (data) => {
        expect(data.reason).toBe(DISCONNECT_REASONS.KICKED);
        resolve();
      });
    });

    const userLeftPromise = new Promise<void>((resolve) => {
      ownerClient.on(CONFIG.EVENTS.SERVER.USER_LEFT, (userData) => {
        expect(userData.id).toBe(userB.id);
        resolve();
      });
    });

    const response = await fetch(`http://localhost:${port}/api/lobbies/${mockLobbyId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userB.id })
    });

    expect(response.status).toBe(200);

    await Promise.all([forceDisconnectPromise, userLeftPromise]);

    ownerClient.close();
    targetClient.close();

    const reconnectedClient = await createAndJoinClient(port, tokenB);
    expect(reconnectedClient.connected).toBe(true);
    reconnectedClient.close();
  });
});
