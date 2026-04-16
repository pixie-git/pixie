import { Server, Socket } from 'socket.io';


export const getLobbyUserCount = (io: Server, lobbyId: string): number => {
  return io.sockets.adapter.rooms.get(lobbyId)?.size || 0;
};


export const getUsersInLobby = async (io: Server, lobbyId: string): Promise<any[]> => {
  const sockets = await io.in(lobbyId).fetchSockets();
  return sockets.map(s => s.data.user).filter(u => u);
};


export const broadcastToLobby = (io: Server, lobbyId: string, event: string, data: any) => {
  io.to(lobbyId).emit(event, data);
};


export const broadcastToOthers = (socket: Socket, lobbyId: string, event: string, data: any) => {
  socket.to(lobbyId).emit(event, data);
};


export const disconnectUserFromLobby = async (
  io: Server,
  lobbyId: string,
  userId: string,
  reason: string
): Promise<boolean> => {
  const sockets = await io.in(lobbyId).fetchSockets();
  const targetSockets = sockets.filter((s: any) => s.data.user?.id === userId);

  if (targetSockets.length === 0) return false;

  const userData = targetSockets[0].data.user;
  const socketIds = targetSockets.map(s => s.id);

  // Notify the users being disconnected
  for (const socket of targetSockets) {
    socket.emit('FORCE_DISCONNECT', { lobbyId, reason });
    socket.leave(lobbyId);
  }

  // Notify everyone else in the lobby about the user leaving
  io.to(lobbyId).except(socketIds).emit('USER_LEFT', userData);

  return true;
};
