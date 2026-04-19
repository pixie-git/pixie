import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import { createAndJoinClient, mockLobbyId, tokenA, teardownTestServer, bootstrapTestServer, setupTestLobby } from './utils/socket-test-utils.js';
import { CanvasService } from '../../src/services/canvas.service.js';
import { canvasStore } from '../../src/store/canvas.store.js';

describe('Memory Unloading & Cleanup Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;

  beforeAll(async () => {
    // bootstrapTestServer already sets up some mocks (JWT, LobbyService, CanvasService)
    const testSetup = await bootstrapTestServer();
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;
  });

  beforeEach(() => {
    setupTestLobby();
    vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined as any);
  });

  afterAll(async () => {
    await teardownTestServer(io, httpServer);
  });

  it('should unload lobby from memory and save to DB when the last client disconnects', async () => {
    const clientA = await createAndJoinClient(port, tokenA);
    
    // Verify lobby is in memory
    expect(canvasStore.isLobbyInMemory(mockLobbyId)).toBe(true);

    // Modify canvas to ensure it's "dirty" (this triggers scheduleSave)
    const drawData = { lobbyId: mockLobbyId, x: 10, y: 10, color: 1 };
    clientA.emit(CONFIG.EVENTS.CLIENT.DRAW, drawData);

    // Give a small amount of time for the draw event to be processed on server
    await new Promise(resolve => setTimeout(resolve, 50));

    // Setup spies
    // We want to verify these are called during disconnection
    const unloadSpy = vi.spyOn(CanvasService, 'unloadLobby');
    const saveSpy = vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined as any);

    // Disconnect Client A
    // This should trigger the 'disconnecting' handler which calls unloadLobby if room is empty
    clientA.disconnect();

    // The disconnection handler is async on the server side
    // We need to wait for it to finish its work.
    // 500ms should be plenty for the async handler to await getUsersInLobby and unloadLobby.
    await new Promise(resolve => setTimeout(resolve, 500));

    // ASSERTIONS
    // 1. unloadLobby was triggered
    expect(unloadSpy).toHaveBeenCalledWith(mockLobbyId);
    
    // 2. saveToDB was called as part of unloading
    expect(saveSpy).toHaveBeenCalledWith(mockLobbyId);
    
    // 3. Lobby was removed from RAM
    expect(canvasStore.isLobbyInMemory(mockLobbyId)).toBe(false);
    
    unloadSpy.mockRestore();
    saveSpy.mockRestore();
  });

  it('should NOT unload lobby if other clients are still connected', async () => {
    const clientA = await createAndJoinClient(port, tokenA);
    const clientB = await createAndJoinClient(port, 'token-b'); // Use tokenB for second user

    // Setup spies
    const unloadSpy = vi.spyOn(CanvasService, 'unloadLobby');

    // Disconnect Client A, but B is still there
    clientA.disconnect();

    await new Promise(resolve => setTimeout(resolve, 500));

    // ASSERTIONS
    // Lobby should NOT be unloaded because Client B is still connected
    expect(unloadSpy).not.toHaveBeenCalled();
    expect(canvasStore.isLobbyInMemory(mockLobbyId)).toBe(true);

    // Now disconnect Client B
    clientB.disconnect();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Now it should be unloaded
    expect(unloadSpy).toHaveBeenCalledWith(mockLobbyId);
    expect(canvasStore.isLobbyInMemory(mockLobbyId)).toBe(false);

    unloadSpy.mockRestore();
  });
});
