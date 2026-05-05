import { Lobby, ILobby } from '../models/Lobby.js';
import { Canvas } from '../models/Canvas.js';
import { DISCONNECT_REASONS } from '../constants/disconnect.constants.js';
import { getRedisClient } from '../db/redis.js';
import { canvasStore } from '../store/canvas.store.js';

/** DTO for banned user data - only expose necessary fields */
export interface BannedUserDTO {
  _id: string;
  username: string;
}

export class LobbyService {

  static async create(name: string, ownerId?: string, options?: any) {
    // Uses the Factory Method defined in the Model
    return await Lobby.createWithCanvas(name, ownerId, options);
  }

  static async getAll() {
    // Returns list with owner info, sorted by newest
    return await Lobby.find()
      .select('name owner createdAt')
      .populate('owner', 'username')
      .sort({ createdAt: -1 });
  }

  static async getByName(name: string) {
    return await Lobby.findOne({ name }).populate('owner', 'username');
  }

  static async getById(id: string) {
    return await Lobby.findById(id).populate('owner', 'username');
  }

  static async banUser(lobbyId: string, userId: string): Promise<ILobby | null> {
    const lobby = await Lobby.findByIdAndUpdate(
      lobbyId,
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

  static async getBannedUsers(lobbyId: string): Promise<BannedUserDTO[]> {
    const lobby = await Lobby.findById(lobbyId)
      .populate<{ bannedUsers: BannedUserDTO[] }>('bannedUsers', '_id username')
      .lean();
    return lobby?.bannedUsers || [];
  }

  static async delete(id: string) {
    const lobby = await Lobby.findById(id);
    if (!lobby) return null;

    if (lobby.canvas) {
      await Canvas.findByIdAndDelete(lobby.canvas);
    }

    await canvasStore.removeLobby(id);

    return await Lobby.findByIdAndDelete(id);
  }

  // Common validation logic for joining/accessing a lobby
  static validateJoinAccess(lobby: ILobby, userId: string): void {
    if (lobby.bannedUsers.some((id: any) => id.toString() === userId)) {
      throw new Error(DISCONNECT_REASONS.BANNED);
    }
  }

  static async incrementCapacity(lobby: ILobby): Promise<void> {
    const redis = getRedisClient();
    const countKey = `lobby:${lobby._id}:count`;
    
    const count = await redis.incr(countKey);
    if (count > lobby.maxCollaborators) {
      await redis.decr(countKey);
      throw new Error(`Lobby is full`);
    }
  }

  static async decrementCapacity(lobbyId: string): Promise<void> {
    const redis = getRedisClient();
    const countKey = `lobby:${lobbyId}:count`;
    
    const count = await redis.decr(countKey);
    if (count < 0) {
      await redis.set(countKey, 0);
    }
  }

}