import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import { LobbyController } from '../../src/controllers/lobby.controller.js';
import { DISCONNECT_REASONS } from '../../src/constants/disconnect.constants.js';
import { LobbyService } from '../../src/services/lobby.service.js';
import {
  createAndJoinClient,
  createClient,
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

// Mock NotificationService to prevent failing on SSE broadcast (side effects)
vi.mock('../../src/services/notification.service.js', () => ({
  NotificationService: {
    sendToUser: vi.fn(),
    broadcast: vi.fn()
  }
}));

describe('Ban User Flow & Persistence Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    setupTestMocks();
    const setup = await createExpressTestServer(userA);
    io = setup.io;
    httpServer = setup.httpServer;
    port = setup.port;
    setup.app.post('/api/lobbies/:id/ban', LobbyController.banUser);
  });

  beforeEach(async () => {
    await setupTestLobby();
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should disconnect the target user, persist to DB, and reject subsequent reconnections', async () => {
    const ownerClient = await createAndJoinClient(port, tokenA);
    const targetClient = await createAndJoinClient(port, tokenB);

    const forceDisconnectPromise = new Promise<void>((resolve) => {
      targetClient.on(CONFIG.EVENTS.SERVER.FORCE_DISCONNECT, (data) => {
        expect(data.reason).toBe(DISCONNECT_REASONS.BANNED);
        resolve();
      });
    });

    const response = await fetch(`http://localhost:${port}/api/lobbies/${mockLobbyId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userB.id })
    });

    expect(response.status).toBe(200);
    await forceDisconnectPromise;
    targetClient.close();

    // Verify DB persistence
    const bannedUsers = await LobbyService.getBannedUsers(mockLobbyId);
    expect(bannedUsers.map(u => u._id.toString())).toContain(userB.id);

    // Verify rejection on reconnection
    const rejectedClient = await createClient(port, tokenB);
    const rejectionPromise = new Promise<void>((resolve) => {
      rejectedClient.on(CONFIG.EVENTS.SERVER.ERROR, (error) => {
        expect(error.message).toBe(DISCONNECT_REASONS.BANNED);
        resolve();
      });
    });

    rejectedClient.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, mockLobbyId);
    await rejectionPromise;
    rejectedClient.close();
    ownerClient.close();
  });
});
