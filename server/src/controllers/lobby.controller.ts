import { Request, Response } from 'express';
import { LobbyService } from '../services/lobby.service.js';
import { PNG } from 'pngjs';

export class LobbyController {

  // POST /api/lobbies
  static async create(req: Request, res: Response) {
    try {
      const { name, description, maxCollaborators, palette, width, height } = req.body;
      const ownerId = (req as any).user?.id;

      if (!name) {
        return res.status(400).json({ error: 'Lobby name is required' });
      }

      if (!ownerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const options = { description, maxCollaborators, palette, width, height };
      const lobby = await LobbyService.create(name, ownerId, options);

      return res.status(201).json(lobby);

    } catch (error: any) {
      // Duplicate name
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Lobby name already taken' });
      }

      console.error('[LobbyController] Create Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /api/lobbies
  static async getAll(req: Request, res: Response) {
    try {
      const lobbies = await LobbyService.getAll();
      return res.json(lobbies);
    } catch (error) {
      console.error('[LobbyController] GetAll Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /api/lobbies/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const lobby = await LobbyService.getById(id);

      if (!lobby) {
        return res.status(404).json({ error: 'Lobby not found' });
      }

      return res.json(lobby);
    } catch (error) {
      console.error('[LobbyController] GetById Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /api/lobbies/:id/users
  static async getUsers(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 1. Validate Lobby Exists & Get Name
      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        return res.status(404).json({ error: 'Lobby not found' });
      }

      const io = (req as any).io;
      if (!io) {
        return res.status(500).json({ error: 'Socket.io not initialized' });
      }

      // 2. Use Lobby Name for Socket Room
      // The socket room is named after the lobby.name, not the _id
      const lobbyName = lobby.name;

      const sockets = await io.in(lobbyName).fetchSockets();
      const users = sockets.map((s: any) => s.data.user).filter((u: any) => u);

      return res.json(users);
    } catch (error) {
      console.error('[LobbyController] GetUsers Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // DELETE /api/lobbies/:id
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await LobbyService.delete(id);

      if (!result) {
        return res.status(404).json({ error: 'Lobby not found' });
      }

      return res.status(200).json({ message: 'Lobby deleted successfully' });
    } catch (error) {
      console.error('[LobbyController] Delete Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  // POST /api/lobbies/:id/kick
  static async kickUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        return res.status(404).json({ error: 'Lobby not found' });
      }

      const io = (req as any).io;
      if (!io) {
        return res.status(500).json({ error: 'Socket.io not initialized' });
      }

      const sockets = await io.in(lobby.name).fetchSockets();
      const targetSocket = sockets.find((s: any) => s.data.user?.id === targetUserId);

      if (targetSocket) {
        // Notify target
        targetSocket.emit('USER_KICKED', { lobbyName: lobby.name });
        // Notify others
        targetSocket.to(lobby.name).emit('USER_LEFT', targetSocket.data.user);
        // Force leave
        targetSocket.leave(lobby.name);
        return res.status(200).json({ message: 'User kicked successfully' });
      } else {
        return res.status(404).json({ error: 'User not found in lobby' });
      }

    } catch (error) {
      console.error('[LobbyController] Kick Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // POST /api/lobbies/:id/ban
  static async banUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      const lobby = await LobbyService.getById(id);
      if (!lobby) {
        return res.status(404).json({ error: 'Lobby not found' });
      }

      // Persist Ban
      await LobbyService.banUser(lobby.name, targetUserId);

      const io = (req as any).io;
      if (io) {
        const sockets = await io.in(lobby.name).fetchSockets();
        const targetSocket = sockets.find((s: any) => s.data.user?.id === targetUserId);

        if (targetSocket) {
          targetSocket.emit('USER_BANNED', { lobbyName: lobby.name });
          targetSocket.to(lobby.name).emit('USER_LEFT', targetSocket.data.user);
          targetSocket.leave(lobby.name);
        }
      }

      return res.status(200).json({ message: 'User banned successfully' });

    } catch (error) {
      console.error('[LobbyController] Ban Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  // GET /api/lobbies/:id/image
  static async getLobbyImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const lobby = await LobbyService.getById(id);

      if (!lobby) {
        return res.status(404).json({ error: 'Lobby not found' });
      }

      const { width, height, pixels, palette } = lobby;

      const png = new PNG({ width, height });

      // pixels is a Buffer or Uint8Array. 
      // If it's missing or wrong size, handle gracefully? 
      // Assuming valid data for now as per schema.

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = y * width + x;
          const colorIndex = pixels[pixelIndex];
          const colorHex = palette[colorIndex] || '#000000';

          // Parse Hex to RGB
          const r = parseInt(colorHex.slice(1, 3), 16);
          const g = parseInt(colorHex.slice(3, 5), 16);
          const b = parseInt(colorHex.slice(5, 7), 16);

          const idx = (width * y + x) << 2; // * 4

          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = 255; // Alpha
        }
      }

      res.setHeader('Content-Type', 'image/png');
      png.pack().pipe(res);

    } catch (error) {
      console.error('[LobbyController] GetImage Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}