import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
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
  setupTestLobby,
  createExpressTestServer
} from './utils/socket-test-utils.js';

describe('Kick User Flow Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    setupTestMocks();

    const setup = await createExpressTestServer(userA); // owner
    io = setup.io;
    httpServer = setup.httpServer;
    port = setup.port;
    const app = setup.app;

    app.post('/api/lobbies/:id/kick', LobbyController.kickUser);
  });

  beforeEach(() => {
    setupTestLobby();
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should disconnect the target user, notify others, and allow reconnection', async () => {
    const ownerClient = await createAndJoinClient(port, tokenA);

    // Setup listener for user join before joining the target client
    const userJoinedPromise = new Promise<void>((resolve) => {
      ownerClient.on(CONFIG.EVENTS.SERVER.USER_JOINED, (data) => {
        if (data.id === userB.id) resolve();
      });
    });

    const targetClient = await createAndJoinClient(port, tokenB);

    // Wait for the owner to acknowledge the target user has joined
    await userJoinedPromise;

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
