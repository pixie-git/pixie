import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { vi } from 'vitest';
import jwt, { Secret, VerifyCallback, JsonWebTokenError } from 'jsonwebtoken';
import { setupSocket } from '../../../src/sockets/index.js';
import { CONFIG } from '../../../src/config.js';
import { LobbyService } from '../../../src/services/lobby.service.js';
import { CanvasService } from '../../../src/services/canvas.service.js';
import { canvasStore } from '../../../src/store/canvas.store.js';

export const mockLobbyId = '507f1f77bcf86cd799439011';
export const userA = { id: '507f1f77bcf86cd799439012', username: 'Alice' };
export const userB = { id: '507f1f77bcf86cd799439013', username: 'Bob' };
export const adminUser = { id: '507f1f77bcf86cd799439014', username: 'Admin', isAdmin: true };
export const tokenA = 'token-a';
export const tokenB = 'token-b';
export const tokenAdmin = 'token-admin';

export const setupTestLobby = (lobbyId = mockLobbyId, width = 100, height = 100) => {
  canvasStore.loadLobbyToMemory(lobbyId, width, height, ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'], new Uint8Array(width * height).fill(0));
};

export const setupTestMocks = () => {
  // Mock JWT verification
  vi.spyOn(jwt, 'verify').mockImplementation(((
    token: string,
    secretOrPublicKey: Secret,
    callback: VerifyCallback
  ) => {
    if (token === tokenA) callback(null, userA);
    else if (token === tokenB) callback(null, userB);
    else if (token === tokenAdmin) callback(null, adminUser);
    else callback(new JsonWebTokenError('Invalid token'), undefined);
  }) as typeof jwt.verify);

  // Mock LobbyService to allow joining
  vi.spyOn(LobbyService, 'getById').mockResolvedValue({ _id: mockLobbyId, maxCollaborators: 10, bannedUsers: [] } as any);
  vi.spyOn(LobbyService, 'validateJoinAccess').mockImplementation(() => { });
  vi.spyOn(LobbyService, 'validateCapacity').mockImplementation(() => { });

  // Mock CanvasService
  vi.spyOn(CanvasService, 'getState').mockImplementation(async (lobbyId) => {
    if (!canvasStore.isLobbyInMemory(lobbyId)) {
      setupTestLobby(lobbyId);
    }
    const meta = canvasStore.getLobbyMetaData(lobbyId)!;
    return { width: meta.width, height: meta.height, palette: meta.palette, data: meta.data };
  });
  vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined as any);
  vi.spyOn(CanvasService, 'draw').mockImplementation((lobbyId, x, y, color) => {
    return canvasStore.modifyPixelColor(lobbyId, x, y, color);
  });
  vi.spyOn(CanvasService, 'drawBatch').mockImplementation((lobbyId, pixels) => {
    return pixels.filter(p => canvasStore.modifyPixelColor(lobbyId, p.x, p.y, p.color));
  });
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

export const bootstrapTestServer = async (withMocks = true) => {
  if (withMocks) setupTestMocks();
  return await createTestServer();
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

export const createAndJoinClient = async (port: number, token: string, lobbyId = mockLobbyId): Promise<ClientSocket> => {
  const client = await createClient(port, token);
  return new Promise((resolve) => {
    client.on(CONFIG.EVENTS.SERVER.INIT_STATE, () => resolve(client));
    client.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, lobbyId);
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
  canvasStore.removeLobby(mockLobbyId);
  vi.restoreAllMocks();
};
