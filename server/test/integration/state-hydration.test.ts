import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer, Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { setupSocket } from '../../src/sockets/index.js';
import { CONFIG } from '../../src/config.js';
import jwt from 'jsonwebtoken';
import { LobbyService } from '../../src/services/lobby.service.js';
import { CanvasService } from '../../src/services/canvas.service.js';
import { canvasStore } from '../../src/store/canvas.store.js';

describe('Initial State Hydration Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  const mockLobbyId = '507f1f77bcf86cd799439011';
  const userA = { id: 'user-a', username: 'Alice' };
  const userB = { id: 'user-b', username: 'Bob' };
  const tokenA = 'token-a';
  const tokenB = 'token-b';

  const canvasWidth = 64;
  const canvasHeight = 64;
  const palette = ['#000000', '#FFFFFF'];

  beforeAll(async () => {
    // Mock JWT verification
    vi.spyOn(jwt, 'verify').mockImplementation((token, secret, callback: any) => {
      if (token === tokenA) callback(null, userA);
      else if (token === tokenB) callback(null, userB);
      else callback(new Error('Invalid token'));
    });

    // Mock LobbyService to allow joining
    vi.spyOn(LobbyService, 'getById').mockResolvedValue({ 
      _id: mockLobbyId, 
      maxCollaborators: 10, 
      bannedUsers: [],
      canvas: '507f191e810c19729de860ea'
    } as any);
    vi.spyOn(LobbyService, 'validateJoinAccess').mockImplementation(() => {});
    vi.spyOn(LobbyService, 'validateCapacity').mockImplementation(() => {});

    // Mock CanvasService methods to avoid DB errors and unintended unloads (KISS)
    vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined);
    vi.spyOn(CanvasService, 'unloadLobby').mockResolvedValue(undefined);

    // Pre-load the lobby into memory
    const initialData = new Uint8Array(canvasWidth * canvasHeight).fill(0);
    canvasStore.loadLobbyToMemory(mockLobbyId, canvasWidth, canvasHeight, palette, initialData);

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
    canvasStore.removeLobby(mockLobbyId);
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

  const joinLobby = (socket: ClientSocket, lobbyId: string): Promise<any> => {
    return new Promise((resolve) => {
      socket.once(CONFIG.EVENTS.SERVER.INIT_STATE, (state) => resolve(state));
      socket.emit(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, lobbyId);
    });
  };

  it('should hydrate a new client with pixels drawn by a previous client', async () => {
    // 1. Connect Client A and join lobby
    const clientA = await createClient(tokenA);
    await joinLobby(clientA, mockLobbyId);

    // 2. Client A draws a pixel at (10, 10) with color 1
    const x = 10;
    const y = 10;
    const color = 1;
    
    await new Promise<void>((resolve) => {
      clientA.once(CONFIG.EVENTS.SERVER.PIXEL_UPDATE, (data) => {
        expect(data).toEqual({ x, y, color });
        resolve();
      });
      clientA.emit(CONFIG.EVENTS.CLIENT.DRAW, { lobbyId: mockLobbyId, x, y, color });
    });

    // 3. Client A disconnects
    clientA.disconnect();

    // Small delay to ensure server handles disconnection
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Connect Client B and join the same lobby
    const clientB = await createClient(tokenB);
    const state: any = await joinLobby(clientB, mockLobbyId);

    // 5. Assertion: Client B receives the INIT_STATE with the pixel at (10, 10) as color 1
    expect(state.width).toBe(canvasWidth);
    expect(state.height).toBe(canvasHeight);
    
    // Uint8Array might arrive as a Buffer/ArrayBuffer depending on the transport
    const pixelData = new Uint8Array(state.data);
    const index = y * canvasWidth + x;
    expect(pixelData[index]).toBe(color);

    clientB.disconnect();
  });
});
