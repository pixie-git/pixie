// src/services/socket.service.ts
import { io, type Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io('http://localhost:3000');
  }

  // Pure Model Logic: Mapping events to callbacks
  onInit(cb: (buffer: ArrayBuffer) => void) {
    this.socket?.on('INIT_STATE', cb);
  }

  onUpdate(cb: (data: { x: number; y: number; color: number }) => void) {
    this.socket?.on('PIXEL_UPDATE', cb);
  }

  emitDraw(payload: { lobbyId: string; x: number; y: number; color: number }) {
    this.socket?.emit('DRAW', payload);
  }

  emitJoinLobby(lobbyId: string) {
    this.socket?.emit('JOIN_LOBBY', lobbyId);
  }
}

export const socketService = new SocketService();