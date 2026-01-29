import { Server, Socket } from 'socket.io';
import { CanvasService } from '../services/canvas.service.js';
import { CONFIG } from '../config.js';
import { DrawPayload, DrawBatchPayload, AuthenticatedSocket } from './types.js';
import { LobbyService } from '../services/lobby.service.js';
import jwt from 'jsonwebtoken';
import { getLobbyUserCount, getUsersInLobby, broadcastToLobby, broadcastToOthers } from '../utils/socketUtils.js';

export const setupSocket = (io: Server) => {
  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(token, CONFIG.JWT.SECRET, (err: any, decoded: any) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      // Attach user info to socket
      (socket as AuthenticatedSocket).user = decoded;
      socket.data.user = decoded;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // --- EVENT: JOIN_LOBBY ---
    // User requests to enter a specific room
    socket.on(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, async (lobbyName: string) => {
      console.log(`[Socket] ${socket.id} joining lobby: ${lobbyName}`);

      try {
        // 1. Get User
        const user = (socket as AuthenticatedSocket).user;
        if (!user || !user.id) {
          console.error(`[Socket] Error: User not found on socket ${socket.id}`);
          return;
        }

        // 2. Validate Join (Service checks existence, ban status, and capacity)
        const currentCount = getLobbyUserCount(io, lobbyName);

        try {
          await LobbyService.verifyCanJoin(lobbyName, user.id, currentCount);
        } catch (e: any) {
          console.error(`[Socket] Join blocked: ${e.message}`);
          socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: e.message });
          return;
        }

        // 3. Join the Socket.io room channel
        socket.join(lobbyName);

        // 4. Broadcast to others that a new user joined
        broadcastToOthers(socket, lobbyName, CONFIG.EVENTS.SERVER.USER_JOINED, user);

        // 5. Send list of connected users to the new user
        const users = await getUsersInLobby(io, lobbyName);
        socket.emit(CONFIG.EVENTS.SERVER.LOBBY_USERS, users);

        // 6. Get current state from Service & Send to user
        const state = await CanvasService.getState(lobbyName);
        socket.emit(CONFIG.EVENTS.SERVER.INIT_STATE, state);
      } catch (error) {
        console.error(`[Socket] Error joining lobby ${lobbyName}:`, error);
        socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Failed to join lobby" });
      }
    });

    // --- EVENT: DRAW ---
    // User wants to color a pixel
    socket.on(CONFIG.EVENTS.CLIENT.DRAW, (payload: DrawPayload) => {
      // Payload validation could happen here or in a DTO
      const { lobbyName, x, y, color } = payload;

      if (!lobbyName) return;

      // 1. Process Logic via Service
      const success = CanvasService.draw(lobbyName, x, y, color);

      // 2. Broadcast if successful
      if (success) {
        // Send to everyone in the room INCLUDING the sender (for consistency)
        broadcastToLobby(io, lobbyName, CONFIG.EVENTS.SERVER.PIXEL_UPDATE, { x, y, color });
      }
    });

    // --- EVENT: DRAW_BATCH ---
    // User wants to color multiple pixels (stroke)
    socket.on(CONFIG.EVENTS.CLIENT.DRAW_BATCH, (payload: DrawBatchPayload) => {
      const { lobbyName, pixels } = payload;
      // pixels: { x, y, color }[]

      if (!lobbyName || !Array.isArray(pixels)) return;

      const successfulUpdates: any[] = [];

      // 1. Process Logic via Service for each pixel
      for (const p of pixels) {
        // Validation: ensure p is an object and has required properties
        if (!p || typeof p !== 'object' || typeof p.x !== 'number' || typeof p.y !== 'number' || typeof p.color !== 'number') {
          continue;
        }
        const { x, y, color } = p;
        const success = CanvasService.draw(lobbyName, x, y, color);
        if (success) {
          successfulUpdates.push({ x, y, color });
        }
      }

      // 2. Broadcast batch if any successful
      if (successfulUpdates.length > 0) {
        // Send to everyone in the room INCLUDING the sender (for consistency)
        broadcastToLobby(io, lobbyName, CONFIG.EVENTS.SERVER.PIXEL_UPDATE_BATCH, { pixels: successfulUpdates });
      }
    });


    // --- DISCONNECTING ---
    socket.on('disconnecting', async () => {
      // Notify rooms that user is leaving
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          broadcastToOthers(socket, room, CONFIG.EVENTS.SERVER.USER_LEFT, (socket as AuthenticatedSocket).user);

          // Check if room is empty (excluding this socket)
          const socketsInRoom = await getUsersInLobby(io, room);
          const remainingUsers = socketsInRoom.length - 1; // fetchSockets includes the disconnecting socket

          if (remainingUsers <= 0) {
            // Room is empty, unload from hot storage
            await CanvasService.unloadLobby(room);
          }
        }
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      // Cleanup logic if needed (e.g., updating user count)
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};