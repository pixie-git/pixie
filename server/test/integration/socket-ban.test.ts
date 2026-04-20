import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
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
  setupTestLobby
} from './utils/socket-test-utils.js';
import { setupSocket } from '../../src/sockets/index.js';

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

    const app = express();
    app.use(express.json());

    httpServer = createServer(app);
    io = new Server(httpServer);
    setupSocket(io);

    // Attach IO and pretend we are UserA (Owner)
    app.use((req, res, next) => {
      (req as any).io = io;
      (req as any).user = userA;
      next();
    });

    app.post('/api/lobbies/:id/ban', LobbyController.banUser);

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
    localBannedUsers = []; // Reset persistence state
    setupTestLobby();
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should disconnect the target user, persist to DB, and reject subsequent reconnections', async () => {

    const ownerClient = await createAndJoinClient(port, tokenA);
    const targetClient = await createAndJoinClient(port, tokenB);

    await new Promise(resolve => setTimeout(resolve, 50));

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
