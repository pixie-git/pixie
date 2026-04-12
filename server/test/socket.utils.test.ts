import { describe, it, expect, vi } from 'vitest';
import { disconnectUserFromLobby } from '../src/utils/socketUtils.js';

describe('socketUtils - disconnectUserFromLobby', () => {
  it('should disconnect ALL sockets belonging to the same user in a lobby', async () => {
    const lobbyId = 'lobby-1';
    const userId = 'user-1';
    const reason = 'test-reason';

    // Mock sockets
    const mockSocket1 = {
      id: 'socket-1',
      data: { user: { id: userId, username: 'user1' } },
      emit: vi.fn(),
      leave: vi.fn(),
    };
    const mockSocket2 = {
      id: 'socket-2',
      data: { user: { id: userId, username: 'user1' } },
      emit: vi.fn(),
      leave: vi.fn(),
    };
    const mockSocket3 = {
      id: 'socket-3',
      data: { user: { id: 'user-2', username: 'user2' } },
      emit: vi.fn(),
      leave: vi.fn(),
    };

    // Mock IO
    const mockIo = {
      in: vi.fn().mockReturnThis(),
      fetchSockets: vi.fn().mockResolvedValue([mockSocket1, mockSocket2, mockSocket3]),
      to: vi.fn().mockReturnThis(),
      except: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    const result = await disconnectUserFromLobby(mockIo as any, lobbyId, userId, reason);

    expect(result).toBe(true);
    
    // RED PHASE: Currently it only disconnects the first one
    // We want BOTH mockSocket1 and mockSocket2 to be disconnected
    expect(mockSocket1.emit).toHaveBeenCalledWith('FORCE_DISCONNECT', { lobbyId, reason });
    expect(mockSocket1.leave).toHaveBeenCalledWith(lobbyId);
    
    expect(mockSocket2.emit).toHaveBeenCalledWith('FORCE_DISCONNECT', { lobbyId, reason });
    expect(mockSocket2.leave).toHaveBeenCalledWith(lobbyId);
    
    // mockSocket3 should NOT be disconnected
    expect(mockSocket3.emit).not.toHaveBeenCalled();
    expect(mockSocket3.leave).not.toHaveBeenCalled();
  });
});
