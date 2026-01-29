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
