import { Request, Response } from 'express';
import { LobbyService } from '../services/lobby.service.js';

export class LobbyController {

  // POST /api/lobbies
  static async create(req: Request, res: Response) {
    try {
      const { name, ownerId } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Lobby name is required' });
      }

      const lobby = await LobbyService.create(name, ownerId);

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
}