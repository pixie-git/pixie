import express from 'express';
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
import { setupRedisDataClient, closeRedisDataClient } from '../../../src/db/redis.js';

vi.mock('../../../src/db/redis.js', () => ({
  setupRedisDataClient: vi.fn().mockResolvedValue({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
  }),
  getRedisClient: vi.fn().mockReturnValue({
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    hGetAll: vi.fn().mockResolvedValue({}),
    hSet: vi.fn().mockResolvedValue(1),
  }),
  closeRedisDataClient: vi.fn().mockResolvedValue(undefined),
}));

export const mockLobbyId = '507f1f77bcf86cd799439011';
export const userA = { id: '507f1f77bcf86cd799439012', username: 'Alice' };
export const userB = { id: '507f1f77bcf86cd799439013', username: 'Bob' };
export const adminUser = { id: '507f1f77bcf86cd799439014', username: 'Admin', isAdmin: true };
export const tokenA = 'token-a';
export const tokenB = 'token-b';
export const tokenAdmin = 'token-admin';

const testCanvasStorage = new Map<string, any>();

export const setupTestLobby = async (lobbyId = mockLobbyId, width = 100, height = 100) => {
  await canvasStore.loadLobbyToMemory(lobbyId, width, height, ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'], new Uint8Array(width * height).fill(0));
};

export const setupTestMocks = () => {
  testCanvasStorage.clear();

  // Mock canvasStore
  vi.spyOn(canvasStore, 'isLobbyInMemory').mockImplementation(async (id) => testCanvasStorage.has(`meta:${id}`));
  vi.spyOn(canvasStore, 'getLobbyMetaData').mockImplementation(async (id) => testCanvasStorage.get(`meta:${id}`));
  vi.spyOn(canvasStore, 'getLobbyPixelData').mockImplementation(async (id) => testCanvasStorage.get(`canvas:${id}`));
  vi.spyOn(canvasStore, 'loadLobbyToMemory').mockImplementation(async (id, w, h, p, d) => {
    testCanvasStorage.set(`meta:${id}`, { width: w, height: h, palette: p, paletteLen: p.length });
    testCanvasStorage.set(`canvas:${id}`, new Uint8Array(d));
  });
  vi.spyOn(canvasStore, 'modifyPixelColor').mockImplementation(async (id, x, y, c) => {
    const data = testCanvasStorage.get(`canvas:${id}`);
    const meta = testCanvasStorage.get(`meta:${id}`);
    if (!data || !meta) return false;
    if (x < 0 || x >= meta.width || y < 0 || y >= meta.height) return false;
    data[y * meta.width + x] = c;
    return true;
  });
  vi.spyOn(canvasStore, 'clearLobbyCanvas').mockImplementation(async (id) => {
    const data = testCanvasStorage.get(`canvas:${id}`);
    if (data) data.fill(0);
    return true;
  });
  vi.spyOn(canvasStore, 'removeLobby').mockImplementation(async (id) => {
    testCanvasStorage.delete(`meta:${id}`);
    testCanvasStorage.delete(`canvas:${id}`);
  });
  vi.spyOn(canvasStore, 'markLobbyDirty').mockResolvedValue();

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
    if (!(await canvasStore.isLobbyInMemory(lobbyId))) {
      await setupTestLobby(lobbyId);
    }
    const meta = await canvasStore.getLobbyMetaData(lobbyId);
    const data = await canvasStore.getLobbyPixelData(lobbyId);
    return { width: meta!.width, height: meta!.height, palette: meta!.palette, data: data! };
  });
  vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined as any);
  vi.spyOn(CanvasService, 'draw').mockImplementation(async (lobbyId, x, y, color) => {
    return await canvasStore.modifyPixelColor(lobbyId, x, y, color);
  });
  vi.spyOn(CanvasService, 'drawBatch').mockImplementation(async (lobbyId, pixels) => {
    const results = await Promise.all(pixels.map(async p => {
      const success = await canvasStore.modifyPixelColor(lobbyId, p.x, p.y, p.color);
      return success ? p : null;
    }));
    return results.filter((p): p is { x: number; y: number; color: number } => p !== null);
  });
  vi.spyOn(CanvasService, 'clearCanvas').mockImplementation(async (lobbyId) => {
    return await canvasStore.clearLobbyCanvas(lobbyId);
  });
};

export const createTestServer = async (): Promise<{ io: Server; httpServer: HTTPServer; port: number }> => {
  await setupRedisDataClient(CONFIG.REDIS_URL);
  const httpServer = createServer();
  const io = new Server(httpServer);
  setupSocket(io);

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(() => {
      const address = httpServer.address();
      if (!address || typeof address === 'string') {
        return reject(new Error('Failed to gracefully acquire a port number for the test server.'));
      }
      resolve({ io, httpServer, port: address.port });
    });
  });
};

export const createExpressTestServer = async (mockUser: any): Promise<{ io: Server; httpServer: HTTPServer; port: number; app: express.Express }> => {
  await setupRedisDataClient(CONFIG.REDIS_URL);
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer);
  setupSocket(io);

  app.use((req, res, next) => {
    (req as any).io = io;
    (req as any).user = mockUser;
    next();
  });

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(() => {
      const address = httpServer.address();
      if (!address || typeof address === 'string') {
        return reject(new Error('Failed to gracefully acquire a port number for the test server.'));
      }
      resolve({ io, httpServer, port: address.port, app });
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
  await canvasStore.removeLobby(mockLobbyId);
  await closeRedisDataClient();
  vi.restoreAllMocks();
};
