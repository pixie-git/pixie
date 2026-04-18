import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { vi } from 'vitest';
import jwt from 'jsonwebtoken';
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
  vi.spyOn(jwt, 'verify').mockImplementation((token: any, secret: any, callback: any) => {
    if (token === tokenA) callback(null, userA);
    else if (token === tokenB) callback(null, userB);
    else callback(new Error('Invalid token'));
  });

  // Mock LobbyService to allow joining
  vi.spyOn(LobbyService, 'getById').mockResolvedValue({ _id: mockLobbyId, maxCollaborators: 10, bannedUsers: [] } as any);
  vi.spyOn(LobbyService, 'validateJoinAccess').mockImplementation(() => {});
  vi.spyOn(LobbyService, 'validateCapacity').mockImplementation(() => {});

  // Mock CanvasService
  vi.spyOn(CanvasService, 'getState').mockResolvedValue({ width: 100, height: 100, palette: [], data: new Uint8Array() });
  vi.spyOn(CanvasService, 'draw').mockReturnValue(true);
  vi.spyOn(CanvasService, 'drawBatch').mockImplementation((lobbyId, pixels) => pixels);
};

export const createTestServer = (): Promise<{ io: Server; httpServer: HTTPServer; port: number }> => {
  const httpServer = createServer();
  const io = new Server(httpServer);
  setupSocket(io);

  return new Promise((resolve) => {
    httpServer.listen(() => {
      const address = httpServer.address();
      const port = typeof address === 'string' ? 0 : address?.port || 0;
      resolve({ io, httpServer, port });
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
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });
};

export const createAndJoinClient = async (port: number, token: string): Promise<ClientSocket> => {
  const client = await createClient(port, token);
  return new Promise((resolve) => {
    client.on(CONFIG.EVENTS.SERVER.INIT_STATE, () => resolve(client));
    client.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, mockLobbyId);
  });
};
