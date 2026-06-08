import express from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { vi } from 'vitest';
import jwt, { Secret, VerifyCallback, JsonWebTokenError } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { setupSocket } from '../../../src/sockets/index.js';
import { CONFIG } from '../../../src/config.js';
import { canvasStore } from '../../../src/store/canvas.store.js';
import { Lobby } from '../../../src/models/Lobby.js';
import { Canvas } from '../../../src/models/Canvas.js';
import { User } from '../../../src/models/User.js';
import { setupRedisDataClient, closeRedisDataClient, getRedisClient } from '../../../src/db/redis.js';

export const mockLobbyId = new mongoose.Types.ObjectId().toString();
export const userA = { id: new mongoose.Types.ObjectId().toString(), username: 'Alice' };
export const userB = { id: new mongoose.Types.ObjectId().toString(), username: 'Bob' };
export const adminUser = { id: new mongoose.Types.ObjectId().toString(), username: 'Admin', isAdmin: true };
export const tokenA = 'token-a';
export const tokenB = 'token-b';
export const tokenAdmin = 'token-admin';

let mongoServer: MongoMemoryServer | null = null;
const createdLobbyIds = new Set<string>();

/**
 * Seeds real Lobby, Canvas, and Users in the in-memory MongoDB.
 * Also hydrates Redis to simulate a warmed-up system.
 */
export const setupTestLobby = async (lobbyId = mockLobbyId, width = 100, height = 100) => {
  // Track this lobby for cleanup
  createdLobbyIds.add(lobbyId);

  // 1. Seed DB (idempotent upserts)
  await User.findOneAndUpdate({ _id: userA.id }, { username: 'Alice', isAdmin: false }, { upsert: true });
  await User.findOneAndUpdate({ _id: userB.id }, { username: 'Bob', isAdmin: false }, { upsert: true });
  await User.findOneAndUpdate({ _id: adminUser.id }, { username: 'Admin', isAdmin: true }, { upsert: true });

  const palette = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];
  const data = Buffer.alloc(width * height, 0);

  // Use findOneAndUpdate with upsert for idempotency
  const canvas = await Canvas.findOneAndUpdate(
    { lobby: lobbyId },
    { width, height, palette, data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!canvas) throw new Error('Failed to create/update canvas for test lobby');

  await Lobby.findOneAndUpdate(
    { _id: lobbyId },
    { 
      name: 'Test Lobby ' + lobbyId, 
      owner: userA.id, 
      canvas: canvas._id, 
      maxCollaborators: 10, 
      bannedUsers: [] 
    },
    { upsert: true }
  );

  // 2. Load to Redis (Primary state for Socket.io logic)
  await canvasStore.loadLobbyToMemory(lobbyId, width, height, palette, new Uint8Array(data));
};

/**
 * Bypass JWT signing for tests that focus on behavior rather than auth protocols.
 */
export const setupTestMocks = () => {
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
};

/**
 * Bootstraps a real HTTP + Socket server connected to In-Memory DB and Redis.
 */
export const createTestServer = async (): Promise<{ io: Server; httpServer: HTTPServer; port: number }> => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }
  await setupRedisDataClient();
  
  const httpServer = createServer();
  const io = new Server(httpServer);
  setupSocket(io);

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(() => {
      const address = httpServer.address();
      if (!address || typeof address === 'string') return reject(new Error('Failed to acquire port'));
      resolve({ io, httpServer, port: address.port });
    });
  });
};

/**
 * Creates an Express test server with injected user context for Controller testing.
 */
export const createExpressTestServer = async (mockUser: any): Promise<{ io: Server; httpServer: HTTPServer; port: number; app: express.Express }> => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }
  await setupRedisDataClient();

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
      if (!address || typeof address === 'string') return reject(new Error('Failed to acquire port'));
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

    const onConnect = () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      resolve(socket);
    };

    const onConnectError = (err: Error) => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.close();
      reject(err);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
  });
};

/**
 * Helper to connect and wait for the initial canvas state.
 */
export const createAndJoinClient = async (port: number, token: string, lobbyId = mockLobbyId): Promise<ClientSocket> => {
  const client = await createClient(port, token);
  return new Promise((resolve) => {
    client.on(CONFIG.EVENTS.SERVER.INIT_STATE, () => resolve(client));
    client.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, lobbyId);
  });
};

/**
 * Graceful cleanup of all infrastructure resources.
 */
export const teardownTestServer = async (io: Server, httpServer: HTTPServer) => {
  // 1. Stop accepting new events and close connections
  io.close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  
  // 2. Small delay to let any in-flight async disconnect handlers finish
  await new Promise(resolve => setTimeout(resolve, 100));

  // 3. Defensive cleanup of all lobbies created in this session
  try {
    const redis = getRedisClient();
    for (const id of createdLobbyIds) {
      await canvasStore.removeLobby(id).catch(() => {});
      await redis.del(`lobby:${id}:count`).catch(() => {});
    }
    createdLobbyIds.clear();
    await closeRedisDataClient().catch(() => {});
  } catch (e) {}
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }
  if (mongoServer) {
    await mongoServer.stop().catch(() => {});
    mongoServer = null;
  }
  vi.restoreAllMocks();
};
