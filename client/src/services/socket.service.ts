import { io, type Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = localStorage.getItem('authToken');
    this.socket = io('http://localhost:3000', {
      auth: { token }
    });
  }

  onConnect(cb: () => void) {
    this.socket?.on('connect', cb);
  }

  onInit(cb: (state: { width: number; height: number; palette: string; data: ArrayBuffer }) => void) {
    this.socket?.on('INIT_STATE', cb);
  }

  onUpdate(cb: (data: { x: number; y: number; color: number }) => void) {
    this.socket?.on('PIXEL_UPDATE', cb);
  }

  onUpdateBatch(cb: (data: { pixels: { x: number; y: number; color: number }[] }) => void) {
    this.socket?.on('PIXEL_UPDATE_BATCH', cb);
  }

  emitDraw(payload: { lobbyName: string; x: number; y: number; color: number }) {
    this.socket?.emit('DRAW', payload);
  }

  emitDrawBatch(payload: { lobbyName: string; pixels: { x: number; y: number; color: number }[] }) {
    this.socket?.emit('DRAW_BATCH', payload);
  }

  emitJoinLobby(lobbyName: string) {
    this.socket?.emit('JOIN_LOBBY', lobbyName);
  }
}

export const socketService = new SocketService();