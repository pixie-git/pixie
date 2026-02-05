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
  const targetSocket = sockets.find((s: any) => s.data.user?.id === userId);

  if (!targetSocket) return false;

  targetSocket.emit('FORCE_DISCONNECT', { lobbyId, reason });
  io.to(lobbyId).except(targetSocket.id).emit('USER_LEFT', targetSocket.data.user);
  targetSocket.leave(lobbyId);

  return true;
};
