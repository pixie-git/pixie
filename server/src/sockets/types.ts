import { Socket } from 'socket.io';

export interface DrawPayload {
  lobbyName: string;
  x: number;
  y: number;
  color: number;
}

export interface DrawBatchPayload {
  lobbyName: string;
  pixels: { x: number; y: number; color: number }[];
}

export interface AuthenticatedSocket extends Socket {
  user?: any; // We can refine this further if we know the JWT payload structure
}
