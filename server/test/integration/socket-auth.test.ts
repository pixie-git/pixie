import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../../src/config.js';
import { createClient, teardownTestServer, bootstrapTestServer } from './utils/socket-test-utils.js';

describe('Socket.IO Authentication Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  const validUser = { id: 'user-auth-123', username: 'TestUser' };

  beforeAll(async () => {
    const testSetup = await bootstrapTestServer(false);
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should reject connection when no token is provided', async () => {
    await expect(createClient(port)).rejects.toThrow('Authentication error: No token provided');
  });

  it('should reject connection when an invalid/tampered token is provided', async () => {
    await expect(createClient(port, 'invalid.tampered.token')).rejects.toThrow('Authentication error: Invalid token');
  });

  it('should reject connection when an expired token is provided', async () => {
    const expiredToken = jwt.sign(
      validUser,
      CONFIG.JWT.SECRET,
      { expiresIn: '-1h' }
    );

    await expect(createClient(port, expiredToken)).rejects.toThrow('Authentication error: Invalid token');
  });

  it('should successfully connect when a valid token is provided', async () => {
    const validToken = jwt.sign(
      validUser,
      CONFIG.JWT.SECRET,
      { expiresIn: '1h' }
    );

    const clientSocket = await createClient(port, validToken);
    expect(clientSocket.connected).toBe(true);
    clientSocket.disconnect();
  });
});

