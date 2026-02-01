import { io, type Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    // Clean up any existing socket to prevent orphaned connections
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const token = localStorage.getItem('authToken');
    const url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.socket = io(url, {
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

  onLobbyDeleted(cb: (data: { message: string }) => void) {
    this.socket?.on('LOBBY_DELETED', cb);
  }

  onGlobalLobbyDeleted(cb: (data: { id: string }) => void) {
    this.socket?.on('LOBBY_DELETED', cb);
  }

  onLobbyCreated<T>(cb: (lobby: T) => void) {
    this.socket?.on('LOBBY_CREATED', cb);
  }

  emitDraw(payload: { lobbyId: string; x: number; y: number; color: number }) {
    this.socket?.emit('DRAW', payload);
  }

  emitDrawBatch(payload: { lobbyId: string; pixels: { x: number; y: number; color: number }[] }) {
    this.socket?.emit('DRAW_BATCH', payload);
  }

  emitJoinLobby(lobbyId: string) {
    this.socket?.emit('JOIN_LOBBY', lobbyId);
  }

  emitClearCanvas(lobbyId: string) {
    this.socket?.emit('CLEAR_CANVAS', lobbyId);
  }

  onCanvasCleared(cb: () => void) {
    this.socket?.on('CANVAS_CLEARED', cb);
  }

  onLobbyUsers<T>(cb: (users: T[]) => void) {
    this.socket?.on('LOBBY_USERS', cb);
  }

  onUserJoined<T>(cb: (user: T) => void) {
    this.socket?.on('USER_JOINED', cb);
  }

  onUserLeft<T>(cb: (user: T) => void) {
    this.socket?.on('USER_LEFT', cb);
  }

  onForceDisconnect(cb: (data: { lobbyId: string; reason: string }) => void) {
    this.socket?.on('FORCE_DISCONNECT', cb);
  }

  onError(cb: (data: { message: string }) => void) {
    this.socket?.on('ERROR', cb);
  }

  onBannedUsersUpdated(cb: (signal: { updated: boolean }) => void) {
    this.socket?.on('BANNED_USERS_UPDATED', cb);
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();