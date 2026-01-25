import { Lobby } from '../models/Lobby.js';

export class LobbyService {

  static async create(name: string, ownerId?: string, options?: any) {
    // Uses the Factory Method defined in the Model
    return await Lobby.createWithCanvas(name, ownerId, options);
  }

  static async getAll() {
    // Returns list with owner info, sorted by newest
    return await Lobby.find()
      .select('name owner createdAt allowedUsers')
      .populate('owner', 'username')
      .sort({ createdAt: -1 });
  }

  static async getByName(name: string) {
    return await Lobby.findOne({ name }).populate('owner', 'username');
  }

  static async getById(id: string) {
    return await Lobby.findById(id).populate('owner', 'username');
  }
}