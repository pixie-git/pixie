import { Lobby, ILobby } from '../models/Lobby.js';

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

  static async banUser(lobbyName: string, userId: string): Promise<ILobby | null> {
    const lobby = await Lobby.findOneAndUpdate(
      { name: lobbyName },
      { $addToSet: { bannedUsers: userId } },
      { new: true }
    );
    return lobby;
  }

  static async unbanUser(lobbyId: string, userId: string): Promise<ILobby | null> {
    return await Lobby.findByIdAndUpdate(
      lobbyId,
      { $pull: { bannedUsers: userId } },
      { new: true }
    );
  }

  static async getBannedUsers(lobbyId: string): Promise<any[]> {
    const lobby = await Lobby.findById(lobbyId).populate('bannedUsers', 'username');
    return lobby?.bannedUsers || [];
  }

  static async delete(id: string) {
    const lobby = await Lobby.findById(id);
    if (!lobby) return null;

    // Delete associated Canvas
    // @ts-ignore
    if (lobby.canvas) {
      // @ts-ignore
      await import('../models/Canvas.js').then(m => m.Canvas.findByIdAndDelete(lobby.canvas));
    }

    return await Lobby.findByIdAndDelete(id);
  }

  // Common validation logic for joining/accessing a lobby
  static validateJoinAccess(lobby: ILobby, userId: string): void {
    if (lobby.bannedUsers.some((id: any) => id.toString() === userId)) {
      throw new Error("Access denied. You are banned from this lobby.");
    }
  }

  static validateCapacity(lobby: ILobby, currentCount: number): void {
    if (currentCount >= lobby.maxCollaborators) {
      throw new Error(`Lobby is full`);
    }
  }

}