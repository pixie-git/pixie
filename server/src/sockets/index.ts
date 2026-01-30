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
    console.log(`[Socket] New connection: ${socket.id}`);

    socket.on(CONFIG.EVENTS.CLIENT.JOIN_LOBBY, async (lobbyName: string) => {
      try {
        const user = (socket as AuthenticatedSocket).user;
        if (!user?.id) {
          console.error(`[Socket] User not found: ${socket.id}`);
          socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "User not authenticated" });
          socket.disconnect(true);
          return;
        }

        const lobby = await LobbyService.getByName(lobbyName);
        if (!lobby) return socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Lobby not found" });

        try {
          LobbyService.validateJoinAccess(lobby, user.id);
        } catch (e: any) {
          return socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: e.message });
        }

        // Disconnect any existing session for this user in the same lobby (last connection wins)
        await disconnectUserFromLobby(io, lobbyName, user.id, 'duplicate_session');

        socket.join(lobbyName); // Optimistic Join

        const currentCount = getLobbyUserCount(io, lobbyName);
        try {
          LobbyService.validateCapacity(lobby, currentCount - 1);
        } catch (e: any) {
          socket.leave(lobbyName);
          return socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Lobby is full" });
        }

        broadcastToOthers(socket, lobbyName, CONFIG.EVENTS.SERVER.USER_JOINED, user);
        socket.emit(CONFIG.EVENTS.SERVER.LOBBY_USERS, await getUsersInLobby(io, lobbyName));
        socket.emit(CONFIG.EVENTS.SERVER.INIT_STATE, await CanvasService.getState(lobbyName));
        console.log(`[Socket] ${socket.id} joined ${lobbyName}`);
      } catch (error) {
        console.error(`[Socket] Join Error:`, error);
        socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Failed to join lobby" });
      }
    });

    socket.on(CONFIG.EVENTS.CLIENT.DRAW, ({ lobbyName, x, y, color }: DrawPayload) => {
      if (lobbyName && CanvasService.draw(lobbyName, x, y, color)) {
        broadcastToLobby(io, lobbyName, CONFIG.EVENTS.SERVER.PIXEL_UPDATE, { x, y, color });
      }
    });

    socket.on(CONFIG.EVENTS.CLIENT.DRAW_BATCH, ({ lobbyName, pixels }: DrawBatchPayload) => {
      if (!lobbyName || !Array.isArray(pixels)) return;
      const updates = CanvasService.drawBatch(lobbyName, pixels);
      if (updates.length) broadcastToLobby(io, lobbyName, CONFIG.EVENTS.SERVER.PIXEL_UPDATE_BATCH, { pixels: updates });
    });

    socket.on(CONFIG.EVENTS.CLIENT.CLEAR_CANVAS, async (lobbyName: string) => {
      try {
        const user = (socket as AuthenticatedSocket).user;
        if (!user || !user.id) return;

        const lobby = await LobbyService.getByName(lobbyName);
        if (!lobby || !lobby.owner) return;

        const ownerId = (lobby.owner as any)._id ? (lobby.owner as any)._id.toString() : lobby.owner.toString();

        if (ownerId !== user.id && !user.isAdmin) {
          socket.emit(CONFIG.EVENTS.SERVER.ERROR, { message: "Only the lobby owner or admin can clear the canvas" });
          return;
        }

        if (CanvasService.clearCanvas(lobbyName)) {
          // Broadcast to EVERYONE in lobby (including sender)
          broadcastToLobby(io, lobbyName, CONFIG.EVENTS.SERVER.CANVAS_CLEARED, {});
          console.log(`[Socket] Lobby '${lobbyName}' cleared by ${user.username}`);
        }

      } catch (error) {
        console.error(`[Socket] Clear Canvas Error:`, error);
      }
    });

    socket.on('disconnecting', async () => {
      for (const room of socket.rooms) {
        if (room === socket.id) continue;
        broadcastToOthers(socket, room, CONFIG.EVENTS.SERVER.USER_LEFT, (socket as AuthenticatedSocket).user);
        const users = await getUsersInLobby(io, room);
        if (users.length - 1 <= 0) await CanvasService.unloadLobby(room);
      }
    });

    socket.on('disconnect', () => console.log(`[Socket] Disconnected: ${socket.id}`));
  });
};