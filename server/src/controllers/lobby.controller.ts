import { Request, Response, NextFunction } from 'express';
import { LobbyService } from '../services/lobby.service.js';
import { ImageService } from '../services/image.service.js';
import { disconnectUserFromLobby, broadcastToLobby } from '../utils/socketUtils.js';
import { AppError } from '../utils/AppError.js';
import { CONFIG } from '../config.js';
import { NotificationService } from '../services/notification.service.js';
import { DISCONNECT_REASONS } from '../constants/disconnect.constants.js';

export class LobbyController {

  // POST /api/lobbies
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, maxCollaborators, palette, width, height } = req.body;
      const ownerId = (req as any).user?.id;

      if (!name) {
        throw new AppError('Lobby name is required', 400);
      }

      if (!ownerId) {
        throw new AppError('Unauthorized', 401);
      }

      const { MIN_WIDTH, MIN_HEIGHT, MAX_WIDTH, MAX_HEIGHT } = CONFIG.CANVAS;
      if (width < MIN_WIDTH || height < MIN_HEIGHT || width > MAX_WIDTH || height > MAX_HEIGHT) {
        throw new AppError(`Canvas dimensions must be between ${MIN_WIDTH}x${MIN_HEIGHT} and ${MAX_WIDTH}x${MAX_HEIGHT}`, 400);
      }

      const options = { description, maxCollaborators, palette, width, height };
      const lobby = await LobbyService.create(name, ownerId, options);

      return res.status(201).json(lobby);

    } catch (error: any) {
      // Duplicate name
      if (error.code === 11000) {
        return next(new AppError('Lobby name already taken', 409));
      }

      next(error);
    }
  }

  // GET /api/lobbies
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const lobbies = await LobbyService.getAll();
      return res.json(lobbies);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lobbies/:id
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const lobby = await LobbyService.getById(id);

      if (!lobby) {
        throw new AppError('Lobby not found', 404);
      }

      return res.json(lobby);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lobbies/:id/users
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // 1. Validate Lobby Exists & Get Name
      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        throw new AppError('Lobby not found', 404);
      }

      const io = (req as any).io;
      if (!io) {
        throw new AppError('Socket.io not initialized', 500);
      }

      // 2. Use Lobby ID for Socket Room
      const sockets = await io.in(id).fetchSockets();
      const users = sockets.map((s: any) => s.data.user).filter((u: any) => u);

      return res.json(users);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/lobbies/:id
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user) {
        throw new AppError('Unauthorized', 401);
      }

      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        throw new AppError('Lobby not found', 404);
      }

      // Authorization Check: Owner or Admin
      const isOwner = lobby.owner?.id === user.id || lobby.owner?._id.toString() === user.id;
      const isAdmin = user.isAdmin;

      if (!isOwner && !isAdmin) {
        throw new AppError('Forbidden: You do not have permission to delete this lobby', 403);
      }

      // Notify and Disconnect Sockets
      const io = (req as any).io;
      if (io) {
        // Emit 'LOBBY_DELETED' to all in room
        io.to(id).emit('LOBBY_DELETED', { message: 'This lobby has been deleted by the owner.' });

        // Force disconnect/leave logic could go here, or client handles the event to redirect
        io.in(id).disconnectSockets();
      }

      await LobbyService.delete(id);

      return res.status(200).json({ message: 'Lobby deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/lobbies/:id/kick
  static async kickUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        throw new AppError('Target user ID is required', 400);
      }

      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        throw new AppError('Lobby not found', 404);
      }

      const io = (req as any).io;
      if (!io) {
        throw new AppError('Socket.io not initialized', 500);
      }

      const wasDisconnected = await disconnectUserFromLobby(io, id, targetUserId, DISCONNECT_REASONS.KICKED);

      if (wasDisconnected) {
        return res.status(200).json({ message: 'User kicked successfully' });
      } else {
        throw new AppError('User not found in lobby', 404);
      }

    } catch (error) {
      next(error);
    }
  }

  // POST /api/lobbies/:id/ban
  static async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        throw new AppError('Target user ID is required', 400);
      }

      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        throw new AppError('Lobby not found', 404);
      }

      // Persist Ban
      await LobbyService.banUser(id, targetUserId);
      console.log(`[Lobby] Banning user ${targetUserId} from ${id}`);

      // Send SSE Notification
      await NotificationService.sendToUser(targetUserId, {
        title: 'Banned from Lobby',
        message: `You have been banned from lobby "${lobby.name}" by the owner.`
      });

      const io = (req as any).io;
      if (io) {
        await disconnectUserFromLobby(io, id, targetUserId, DISCONNECT_REASONS.BANNED);
        // Broadcast non-sensitive signal - clients with permission will refetch via REST
        broadcastToLobby(io, id, CONFIG.EVENTS.SERVER.BANNED_USERS_UPDATED, { updated: true });
      }

      return res.status(200).json({ message: 'User banned successfully' });

    } catch (error) {
      next(error);
    }
  }

  // GET /api/lobbies/:id/banned
  static async getBannedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const bannedUsers = await LobbyService.getBannedUsers(id);
      return res.json(bannedUsers);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/lobbies/:id/unban
  static async unbanUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        throw new AppError('Target user ID is required', 400);
      }

      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        throw new AppError('Lobby not found', 404);
      }

      await LobbyService.unbanUser(id, targetUserId);
      console.log(`[Lobby] Unbanning user ${targetUserId} from ${lobby.name}`);

      // Broadcast non-sensitive signal - clients with permission will refetch via REST
      const io = (req as any).io;
      if (io) {
        broadcastToLobby(io, id, CONFIG.EVENTS.SERVER.BANNED_USERS_UPDATED, { updated: true });
      }

      return res.status(200).json({ message: 'User unbanned successfully' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lobbies/:id/image
  static async getLobbyImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const lobby = await LobbyService.getById(id);

      if (!lobby) {
        throw new AppError('Lobby not found', 404);
      }

      const scaleStr = req.query.scale as string;
      const scale = scaleStr ? parseInt(scaleStr, 10) : 1;

      const png = await ImageService.generateLobbyPng(id, scale);

      res.setHeader('Content-Type', 'image/png');
      png.pack().pipe(res);
    } catch (error) {
      next(error);
    }
  }
}
