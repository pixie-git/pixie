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

// 1. Mock the specific MongoDB call in User model using `vi.mock`
vi.mock('../../src/models/User.js', () => ({
  User: {
    findById: vi.fn().mockImplementation(async (id) => {
      if (id === userB.id) return { _id: userB.id, isAdmin: false };
      return null;
    })
  }
}));

// 2. Mock NotificationService to prevent failing on SSE broadcast
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

  let localBannedUsers: string[] = [];

  beforeAll(async () => {
    setupTestMocks();

    // Override the mocked LobbyService to inject `localBannedUsers` state for this test
    vi.spyOn(LobbyService, 'getById').mockImplementation(async () => {
      return {
        _id: mockLobbyId,
        owner: userA.id,
        maxCollaborators: 10,
        bannedUsers: localBannedUsers,
        name: 'Test Lobby'
      } as any;
    });

    vi.spyOn(LobbyService, 'banUser').mockImplementation(async (id, userId) => {
      localBannedUsers.push(userId);
      return null as any;
    });

    vi.spyOn(LobbyService, 'validateJoinAccess').mockImplementation((lobby, userId) => {
      if (lobby.bannedUsers.some((id: any) => id.toString() === userId)) {
        throw new Error(DISCONNECT_REASONS.BANNED);
      }
    });

    const setup = await createExpressTestServer(userA);
    io = setup.io;
    httpServer = setup.httpServer;
    port = setup.port;
    const app = setup.app;

    app.post('/api/lobbies/:id/ban', LobbyController.banUser);
  });

  beforeEach(async () => {
    localBannedUsers = []; // Reset persistence state
    await setupTestLobby();
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should disconnect the target user, persist to DB, and reject subsequent reconnections', async () => {

    const ownerClient = await createAndJoinClient(port, tokenA);

    const userJoinedPromise = new Promise<void>((resolve) => {
      ownerClient.on(CONFIG.EVENTS.SERVER.USER_JOINED, (data) => {
        if (data.id === userB.id) resolve();
      });
    });

    const targetClient = await createAndJoinClient(port, tokenB);

    await userJoinedPromise;

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
    ownerClient.close();

    expect(localBannedUsers).toContain(userB.id);
    expect(LobbyService.banUser).toHaveBeenCalledWith(mockLobbyId, userB.id);

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
  });
});
