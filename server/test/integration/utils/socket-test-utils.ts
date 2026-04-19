import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { vi } from 'vitest';
import jwt, { Secret, VerifyCallback, JsonWebTokenError } from 'jsonwebtoken';
import { setupSocket } from '../../../src/sockets/index.js';
import { CONFIG } from '../../../src/config.js';
import { LobbyService } from '../../../src/services/lobby.service.js';
import { CanvasService } from '../../../src/services/canvas.service.js';

export const mockLobbyId = 'test-lobby-id';
export const userA = { id: 'user-a', username: 'Alice' };
export const userB = { id: 'user-b', username: 'Bob' };
export const tokenA = 'token-a';
export const tokenB = 'token-b';

export const setupTestMocks = () => {
  // Mock JWT verification
  vi.spyOn(jwt, 'verify').mockImplementation(((
    token: string,
    secretOrPublicKey: Secret,
    callback: VerifyCallback
  ) => {
    if (token === tokenA) callback(null, userA);
    else if (token === tokenB) callback(null, userB);
    else callback(new JsonWebTokenError('Invalid token'), undefined);
  }) as typeof jwt.verify);

  // Mock LobbyService to allow joining
  vi.spyOn(LobbyService, 'getById').mockResolvedValue({ _id: mockLobbyId, maxCollaborators: 10, bannedUsers: [] } as any);
  vi.spyOn(LobbyService, 'validateJoinAccess').mockImplementation(() => { });
  vi.spyOn(LobbyService, 'validateCapacity').mockImplementation(() => { });

  // Mock CanvasService
  vi.spyOn(CanvasService, 'getState').mockResolvedValue({ width: 100, height: 100, palette: [], data: new Uint8Array() });
  vi.spyOn(CanvasService, 'draw').mockReturnValue(true);
  vi.spyOn(CanvasService, 'drawBatch').mockImplementation((lobbyId, pixels) => pixels);
};

export const createTestServer = (): Promise<{ io: Server; httpServer: HTTPServer; port: number }> => {
  const httpServer = createServer();
  const io = new Server(httpServer);
  setupSocket(io);

  return new Promise((resolve, reject) => {
    httpServer.listen(() => {
      const address = httpServer.address();
      if (!address || typeof address === 'string') {
        return reject(new Error('Failed to gracefully acquire a port number for the test server.'));
      }
      resolve({ io, httpServer, port: address.port });
    });
  });
};

export const createClient = (port: number, token?: string): Promise<ClientSocket> => {
  return new Promise((resolve, reject) => {
    const socket = Client(`http://localhost:${port}`, {
      ...(token ? { auth: { token } } : {}),
      reconnection: false,
      transports: ['websocket'],
    });
    const cleanup = () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
    };
    const onConnect = () => {
      cleanup();
      resolve(socket);
    };
    const onConnectError = (err: Error) => {
      cleanup();
      socket.close();
      reject(err);
    };
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
  });
};

export const createAndJoinClient = async (port: number, token: string): Promise<ClientSocket> => {
  const client = await createClient(port, token);
  return new Promise((resolve) => {
    client.on(CONFIG.EVENTS.SERVER.INIT_STATE, () => resolve(client));
    client.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, mockLobbyId);
  });
};

export const teardownTestServer = async (io: Server, httpServer: HTTPServer) => {
  io.close();
  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  vi.restoreAllMocks();
};
