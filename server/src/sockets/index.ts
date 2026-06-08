import { Server, Socket } from 'socket.io';
import { CanvasService } from '../services/canvas.service.js';
import { CONFIG } from '../config.js';
import { DrawPayload, DrawBatchPayload, AuthenticatedSocket } from './types.js';
import { LobbyService } from '../services/lobby.service.js';
import jwt from 'jsonwebtoken';
import { getLobbyUserCount, getUsersInLobby, broadcastToLobby, broadcastToOthers, disconnectUserFromLobby } from '../utils/socketUtils.js';

export const setupSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: No token provided"));
    jwt.verify(token, CONFIG.JWT.SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication error: Invalid token"));
      (socket as AuthenticatedSocket).user = decoded;
      socket.data.user = decoded;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] [${process.env.SERVER_ID || 'single'}] New connection: ${socket.id}`);

    socket.on(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, async (lobbyId: string) => {
      let isIncremented = false;
      try {
        const user = (socket as AuthenticatedSocket).user;
        if (!user?.id) {
          console.error(`[Socket] User not found: ${socket.id}`);
          socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "User not authenticated" });
          socket.disconnect(true);
          return;
        }

        const lobby = await LobbyService.getById(lobbyId);
        if (!lobby) return socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Lobby not found" });

        try {
          LobbyService.validateJoinAccess(lobby, user.id);
        } catch (e: any) {
          return socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: e.message });
        }

        // Disconnect any existing session for this user in the same lobby (last connection wins)
        await disconnectUserFromLobby(io, lobbyId, user.id, 'duplicate_session');

        try {
          await LobbyService.incrementCapacity(lobby);
          isIncremented = true;
        } catch (e: any) {
          return socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Lobby is full" });
        }

        socket.join(lobbyId); // Optimistic Join - moved after capacity check

        broadcastToOthers(socket, lobbyId, CONFIG.EVENTS.SERVER.USER_JOINED, user);
        socket.emit(CONFIG.EVENTS.SERVER.LOBBY_USERS, await getUsersInLobby(io, lobbyId));
        socket.emit(CONFIG.EVENTS.SERVER.INIT_STATE, await CanvasService.getState(lobbyId));
        console.log(`[Socket] ${socket.id} joined ${lobbyId}`);
      } catch (error) {
        console.error(`[Socket] Join Error:`, error);
        if (isIncremented) {
          LobbyService.decrementCapacity(lobbyId).catch(console.error);
        }
        socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Failed to join lobby" });
      }
    });

    socket.on(CONFIG.EVENTS.CLIENT.DRAW, async ({ lobbyId, x, y, color }: DrawPayload) => {
      if (!lobbyId || !socket.rooms.has(lobbyId)) return;
      if (await CanvasService.draw(lobbyId, x, y, color)) {
        broadcastToLobby(io, lobbyId, CONFIG.EVENTS.SERVER.PIXEL_UPDATE, { x, y, color });
      }
    });

    socket.on(CONFIG.EVENTS.CLIENT.DRAW_BATCH, async ({ lobbyId, pixels }: DrawBatchPayload) => {
      if (!lobbyId || !socket.rooms.has(lobbyId) || !Array.isArray(pixels)) return;
      const updates = await CanvasService.drawBatch(lobbyId, pixels);
      if (updates.length) broadcastToLobby(io, lobbyId, CONFIG.EVENTS.SERVER.PIXEL_UPDATE_BATCH, { pixels: updates });
    });

    socket.on(CONFIG.EVENTS.CLIENT.CLEAR_CANVAS, async (lobbyId: string) => {
      try {
        if (!lobbyId || !socket.rooms.has(lobbyId)) return;
        const user = (socket as AuthenticatedSocket).user;
        if (!user || !user.id) return;

        const lobby = await LobbyService.getById(lobbyId);
        if (!lobby) return;

        let ownerId: string | null = null;
        if (lobby.owner) {
          ownerId = (lobby.owner as any)._id ? (lobby.owner as any)._id.toString() : lobby.owner.toString();
        }

        const isOwner = ownerId && ownerId === user.id;

        if (!isOwner && !user.isAdmin) {
          socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Only the lobby owner or admin can clear the canvas" });
          return;
        }

        if (await CanvasService.clearCanvas(lobbyId)) {
          // Broadcast to EVERYONE in lobby (including sender)
          broadcastToLobby(io, lobbyId, CONFIG.EVENTS.SERVER.CANVAS_CLEARED, {});
          console.log(`[Socket] Lobby '${lobbyId}' cleared by ${user.username}`);
        }

      } catch (error) {
        console.error(`[Socket] Clear Canvas Error:`, error);
      }
    });

    socket.on('disconnecting', async () => {
      for (const room of socket.rooms) {
        if (room === socket.id) continue;
        broadcastToOthers(socket, room, CONFIG.EVENTS.SERVER.USER_LEFT, (socket as AuthenticatedSocket).user);
        LobbyService.decrementCapacity(room).catch(console.error);

        // If this is the last user leaving the lobby, unload it from Redis
        const users = await io.in(room).fetchSockets();
        if (users.length <= 1) { // 1 because the current socket is still in the room list
          await CanvasService.unloadLobby(room);
        }
      }
    });

    socket.on('disconnect', () => console.log(`[Socket] [${process.env.SERVER_ID || 'single'}] Disconnected: ${socket.id}`));
  });
};