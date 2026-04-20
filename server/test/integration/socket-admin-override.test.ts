import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { CONFIG } from '../../src/config.js';
import { LobbyController } from '../../src/controllers/lobby.controller.js';
import { requireLobbyOwner } from '../../src/middlewares/permissionMiddleware.js';
import { DISCONNECT_REASONS } from '../../src/constants/disconnect.constants.js';
import {
  createAndJoinClient,
  mockLobbyId,
  tokenA,
  userA,
  tokenAdmin,
  adminUser,
  teardownTestServer,
  setupTestMocks,
  setupTestLobby,
  createExpressTestServer
} from './utils/socket-test-utils.js';

vi.mock('../../src/models/Lobby.js', () => ({
  Lobby: {
    findById: vi.fn().mockImplementation(async (id) => {
      if (id === mockLobbyId) return { _id: mockLobbyId, owner: userA.id };
      return null;
    })
  }
}));

describe('Admin Override Authority Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    setupTestMocks();

    const setup = await createExpressTestServer(adminUser);
    io = setup.io;
    httpServer = setup.httpServer;
    port = setup.port;
    const app = setup.app;

    app.post('/api/lobbies/:id/kick', requireLobbyOwner, LobbyController.kickUser);
  });

  beforeEach(() => {
    setupTestLobby();
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should allow admin to clear canvas and kick the original owner', async () => {
    const ownerClient = await createAndJoinClient(port, tokenA);
    const adminClient = await createAndJoinClient(port, tokenAdmin);

    await new Promise(resolve => setTimeout(resolve, 50));

    const clearCanvasPromise = new Promise<void>((resolve) => {
      ownerClient.on(CONFIG.EVENTS.SERVER.CANVAS_CLEARED, () => {
        resolve();
      });
    });

    adminClient.emit(CONFIG.EVENTS.CLIENT.CLEAR_CANVAS, mockLobbyId);

    await clearCanvasPromise;


    const forceDisconnectPromise = new Promise<void>((resolve) => {
      ownerClient.on(CONFIG.EVENTS.SERVER.FORCE_DISCONNECT, (data) => {
        expect(data.reason).toBe(DISCONNECT_REASONS.KICKED);
        resolve();
      });
    });

    const response = await fetch(`http://localhost:${port}/api/lobbies/${mockLobbyId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userA.id })
    });

    expect(response.status).toBe(200);

    await forceDisconnectPromise;
    ownerClient.close();
    adminClient.close();
  });
});
