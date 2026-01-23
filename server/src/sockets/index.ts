import { Server, Socket } from 'socket.io';
import { CanvasService } from '../services/canvas.service.js';
import { CONFIG } from '../config.js';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // --- EVENT: JOIN_LOBBY ---
    // User requests to enter a specific room
    socket.on(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, async (lobbyName: string) => {
      console.log(`[Socket] ${socket.id} joining lobby: ${lobbyName}`);

      // 1. Join the Socket.io room channel
      socket.join(lobbyName);

      try {
        // 2. Get current state from Service
        const state = await CanvasService.getState(lobbyName);

        // 3. Send state back to the user
        socket.emit(CONFIG.EVENTS.SERVER.INIT_STATE, state);
      } catch (error) {
        console.error(`[Socket] Error joining lobby ${lobbyName}:`, error);
        socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Failed to join lobby" });
      }
    });

    // --- EVENT: DRAW ---
    // User wants to color a pixel
    socket.on(CONFIG.EVENTS.CLIENT.DRAW, (payload: any) => {
      // Payload validation could happen here or in a DTO
      const { lobbyName, x, y, color } = payload;

      if (!lobbyName) return;

      // 1. Process Logic via Service
      const success = CanvasService.draw(lobbyName, x, y, color);

      // 2. Broadcast if successful
      if (success) {
        // Send to everyone in the room EXCEPT the sender
        socket.to(lobbyName).emit(CONFIG.EVENTS.SERVER.PIXEL_UPDATE, { x, y, color });
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      // Cleanup logic if needed (e.g., updating user count)
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};