import { Server, Socket } from 'socket.io';

/**
 * Gets the number of connected users in a specific lobby.
 * @param io The Socket.IO server instance
 * @param lobbyName The name of the lobby (room)
 * @returns The number of clients in the room
 */
export const getLobbyUserCount = (io: Server, lobbyName: string): number => {
  return io.sockets.adapter.rooms.get(lobbyName)?.size || 0;
};

/**
 * Fetches all users currently connected to a lobby.
 */
export const getUsersInLobby = async (io: Server, lobbyName: string): Promise<any[]> => {
  const sockets = await io.in(lobbyName).fetchSockets();
  return sockets.map(s => s.data.user).filter(u => u);
};

/**
 * Broadcasts an event to all users in a lobby (including sender).
 */
export const broadcastToLobby = (io: Server, lobbyName: string, event: string, data: any) => {
  io.to(lobbyName).emit(event, data);
};

/**
 * Broadcasts an event to all other users in a lobby (excluding sender).
 */
export const broadcastToOthers = (socket: Socket, lobbyName: string, event: string, data: any) => {
  socket.to(lobbyName).emit(event, data);
};

/**
 * Disconnects a specific user from a lobby room.
 * Emits FORCE_DISCONNECT event, notifies others with USER_LEFT, and leaves room.
 * 
 * @param io - Socket.IO server instance
 * @param lobbyName - The lobby room name
 * @param userId - The user ID to disconnect
 * @param reason - Reason for disconnect (e.g., 'duplicate_session', 'kicked', 'banned')
 * @returns true if user was found and disconnected, false otherwise
 */
export const disconnectUserFromLobby = async (
  io: Server,
  lobbyName: string,
  userId: string,
  reason: string
): Promise<boolean> => {
  const sockets = await io.in(lobbyName).fetchSockets();
  const targetSocket = sockets.find((s: any) => s.data.user?.id === userId);

  if (!targetSocket) return false;

  // Notify the disconnected user with the reason
  targetSocket.emit('FORCE_DISCONNECT', { lobbyName, reason });
  // Notify other users in the lobby (broadcast to room except target)
  io.to(lobbyName).except(targetSocket.id).emit('USER_LEFT', targetSocket.data.user);
  // Remove from room
  targetSocket.leave(lobbyName);

  return true;
};
