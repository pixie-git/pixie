import { Socket } from 'socket.io';

export interface DrawPayload {
  lobbyId: string;
  x: number;
  y: number;
  color: number;
}

export interface DrawBatchPayload {
  lobbyId: string;
  pixels: { x: number; y: number; color: number }[];
}

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
}
