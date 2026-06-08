import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import { createAndJoinClient, mockLobbyId, tokenA, teardownTestServer, bootstrapTestServer, setupTestLobby } from './utils/socket-test-utils.js';

describe('Socket Duplicate Session Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    const testSetup = await bootstrapTestServer();
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;
  });

  beforeEach(async () => {
    await setupTestLobby();
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should forcefully disconnect older session when a duplicate session joins', async () => {
    const clientA = await createAndJoinClient(port, tokenA);

    const forceDisconnectPromise = new Promise<{ reason: string, lobbyId: string }>((resolve) => {
      clientA.on(CONFIG.EVENTS.SERVER.FORCE_DISCONNECT, (data) => {
        resolve(data);
      });
    });

    const clientB = await createAndJoinClient(port, tokenA);

    const disconnectData = await forceDisconnectPromise;
    expect(disconnectData).toEqual({
      lobbyId: mockLobbyId,
      reason: 'duplicate_session'
    });

    clientA.close();
    clientB.close();
  });
});
