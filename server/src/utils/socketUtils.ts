import { Server, Socket } from 'socket.io';


export const getLobbyUserCount = async (io: Server, lobbyId: string): Promise<number> => {
  const { getRedisClient } = await import('../db/redis.js');
  const redis = getRedisClient();
  const count = await redis.get(`lobby:${lobbyId}:count`);
  return count ? parseInt(count, 10) : 0;
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

  // Notify everyone else in the lobby about the user leaving
  io.to(lobbyId).except(socketIds).emit('USER_LEFT', userData);

  // Load LobbyService once before the loop
  const { LobbyService } = await import('../services/lobby.service.js');

  // Notify the users being disconnected
  for (const socket of targetSockets) {
    socket.emit('FORCE_DISCONNECT', { lobbyId, reason });
    await socket.leave(lobbyId);
    
    // Ensure capacity is decremented when we forcibly remove a user
    try {
      await LobbyService.decrementCapacity(lobbyId);
    } catch (err) {
      console.error(err);
    }
    
    socket.disconnect(true);
  }

  // Unload the lobby if no active connections remain
  const remainingSockets = await io.in(lobbyId).fetchSockets();
  if (remainingSockets.length === 0) {
    const { CanvasService } = await import('../services/canvas.service.js');
    await CanvasService.unloadLobby(lobbyId);
  }

  return true;
};
