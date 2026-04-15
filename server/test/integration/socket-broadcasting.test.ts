import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { setupSocket } from '../../src/sockets/index.js';
import { CONFIG } from '../../src/config.js';
import jwt from 'jsonwebtoken';
import { LobbyService } from '../../src/services/lobby.service.js';
import { CanvasService } from '../../src/services/canvas.service.js';

describe('Socket Broadcasting Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  const mockLobbyId = 'test-lobby-id';
  const userA = { id: 'user-a', username: 'Alice' };
  const userB = { id: 'user-b', username: 'Bob' };
  const tokenA = 'token-a';
  const tokenB = 'token-b';

  beforeAll(async () => {
    // Mock JWT verification
    vi.spyOn(jwt, 'verify').mockImplementation((token, secret, callback: any) => {
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

    httpServer = createServer();
    io = new Server(httpServer);
    setupSocket(io);

    return new Promise<void>((resolve) => {
      httpServer.listen(() => {
        const address = httpServer.address();
        port = typeof address === 'string' ? 0 : address?.port || 0;
        resolve();
      });
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
    vi.restoreAllMocks();
  });

  const createClient = (token: string): Promise<ClientSocket> => {
    return new Promise((resolve, reject) => {
      const socket = Client(`http://localhost:${port}`, {
        auth: { token },
        transports: ['websocket'],
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', (err) => reject(err));
    });
  };

  const createAndJoinClient = async (token: string): Promise<ClientSocket> => {
    const client = await createClient(token);
    client.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, mockLobbyId);
    return client;
  };

  it('should broadcast DRAW event from Client A as PIXEL_UPDATE to Client B', async () => {
    const clientA = await createAndJoinClient(tokenA);
    const clientB = await createAndJoinClient(tokenB);

    // Wait for B to receive PIXEL_UPDATE
    const drawData = { lobbyId: mockLobbyId, x: 10, y: 20, color: 1 };
    
    return new Promise<void>((resolve) => {
      clientB.on(CONFIG.EVENTS.SERVER.PIXEL_UPDATE, (data) => {
        expect(data).toEqual({ x: 10, y: 20, color: 1 });
        clientA.close();
        clientB.close();
        resolve();
      });

      // Small delay to ensure both joined
      setTimeout(() => {
        clientA.emit(CONFIG.EVENTS.CLIENT.DRAW, drawData);
      }, 50);
    });
  });

  it('should broadcast DRAW_BATCH event from Client A as PIXEL_UPDATE_BATCH to Client B', async () => {
    const clientA = await createAndJoinClient(tokenA);
    const clientB = await createAndJoinClient(tokenB);

    const batchData = {
      lobbyId: mockLobbyId,
      pixels: [
        { x: 1, y: 1, color: 2 },
        { x: 2, y: 2, color: 3 }
      ]
    };

    return new Promise<void>((resolve) => {
      clientB.on(CONFIG.EVENTS.SERVER.PIXEL_UPDATE_BATCH, (data) => {
        expect(data.pixels).toEqual(batchData.pixels);
        clientA.close();
        clientB.close();
        resolve();
      });

      setTimeout(() => {
        clientA.emit(CONFIG.EVENTS.CLIENT.DRAW_BATCH, batchData);
      }, 50);
    });
  });
});
