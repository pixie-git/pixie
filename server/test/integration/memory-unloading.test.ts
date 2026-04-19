import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { CONFIG } from '../../src/config.js';
import { createAndJoinClient, mockLobbyId, tokenA, tokenB, teardownTestServer, bootstrapTestServer, setupTestLobby } from './utils/socket-test-utils.js';
import { CanvasService } from '../../src/services/canvas.service.js';
import { canvasStore } from '../../src/store/canvas.store.js';

describe('Memory Unloading & Cleanup Integration', () => {
  let io: Server;
  let httpServer: HTTPServer;
  let port: number;
  let unloadSpy: any;
  let saveSpy: any;

  beforeAll(async () => {
    // bootstrapTestServer already sets up some mocks (JWT, LobbyService, CanvasService)
    const testSetup = await bootstrapTestServer();
    io = testSetup.io;
    httpServer = testSetup.httpServer;
    port = testSetup.port;
  });

  beforeEach(() => {
    setupTestLobby();
    // Ensure saveToDB is mocked to avoid real DB calls
    saveSpy = vi.spyOn(CanvasService, 'saveToDB').mockResolvedValue(undefined as any);
    // Restore real implementation for draw to exercise scheduleSave/timers
    vi.spyOn(CanvasService, 'draw').mockRestore();
    // Spy on unloadLobby to verify it was called
    unloadSpy = vi.spyOn(CanvasService, 'unloadLobby');

    saveSpy.mockClear();
    unloadSpy.mockClear();
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

    // Disconnect Client A
    // This should trigger the 'disconnecting' handler which calls unloadLobby if room is empty
    clientA.disconnect();

    // The disconnection handler is async on the server side
    // We wait until the lobby is removed from RAM deterministically
    await vi.waitFor(() => {
      if (canvasStore.isLobbyInMemory(mockLobbyId)) {
        throw new Error('Lobby still in memory');
      }
    }, { timeout: 2000, interval: 50 });

    // ASSERTIONS
    // 1. unloadLobby was triggered
    expect(unloadSpy).toHaveBeenCalledWith(mockLobbyId);
    
    // 2. saveToDB was called as part of unloading
    expect(saveSpy).toHaveBeenCalledWith(mockLobbyId);
  });

  it('should NOT unload lobby if other clients are still connected', async () => {
    const clientA = await createAndJoinClient(port, tokenA);
    const clientB = await createAndJoinClient(port, tokenB); // Use tokenB constant for second user

    // Disconnect Client A, but B is still there
    clientA.disconnect();

    // Wait a bit to ensure it doesn't flip incorrectly (we still need a small wait to confirm negative case, or check call count)
    await new Promise(resolve => setTimeout(resolve, 100));

    // ASSERTIONS
    // Lobby should NOT be unloaded because Client B is still connected
    expect(unloadSpy).not.toHaveBeenCalled();
    expect(canvasStore.isLobbyInMemory(mockLobbyId)).toBe(true);

    // Now disconnect Client B
    clientB.disconnect();
    
    // Now it should be unloaded deterministically
    await vi.waitFor(() => {
      if (canvasStore.isLobbyInMemory(mockLobbyId)) {
        throw new Error('Lobby still in memory');
      }
    }, { timeout: 2000, interval: 50 });

    expect(unloadSpy).toHaveBeenCalledWith(mockLobbyId);
  });
});
