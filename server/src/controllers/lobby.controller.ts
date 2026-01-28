import { Request, Response } from 'express';
import { LobbyService } from '../services/lobby.service.js';

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
}