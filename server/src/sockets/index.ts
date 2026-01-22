import { Server, Socket } from 'socket.io';
import { CanvasService } from '../services/canvas.service.ts';
import { CONFIG } from '../config.ts';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // --- EVENT: JOIN_LOBBY ---
    // User requests to enter a specific room
    socket.on(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, (lobbyId: string) => {
      console.log(`[Socket] ${socket.id} joining lobby: ${lobbyId}`);

      // 1. Join the Socket.io room channel
      socket.join(lobbyId);

      // 2. Get current state from Service
      const state = CanvasService.getLobbyState(lobbyId);

      // 3. Send state back to the user
      socket.emit(CONFIG.EVENTS.SERVER.INIT_STATE, state);
    });

    // --- EVENT: DRAW ---
    // User wants to color a pixel
    socket.on(CONFIG.EVENTS.CLIENT.DRAW, (payload: any) => {
      // Payload validation could happen here or in a DTO
      const { lobbyId, x, y, color } = payload;

      if (!lobbyId) return;

      // 1. Process Logic via Service
      const result = CanvasService.drawPixel(lobbyId, x, y, color);

      // 2. Broadcast if successful
      if (result) {
        // Send to everyone in the room EXCEPT the sender
        socket.to(lobbyId).emit(CONFIG.EVENTS.SERVER.PIXEL_UPDATE, result);
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      // Cleanup logic if needed (e.g., updating user count)
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};