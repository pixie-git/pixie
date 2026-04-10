import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { ILobby } from '../models/Lobby.js';
import { LobbyService } from './lobby.service.js';

export const mockLobby = {
  _id: new Types.ObjectId(),
  name: 'Test Lobby',
  description: 'Mock lobby for testing',
  maxCollaborators: 10,
  owner: new Types.ObjectId(),
  canvas: new Types.ObjectId(),
  bannedUsers: [],
  createdAt: new Date(),
  updatedAt: new Date()
} as unknown as ILobby;

describe('LobbyService - Capacity & Resource Management', () => {
  it('should throw an error when current count equals maxUsers', () => {
    expect(() => {
      LobbyService.validateCapacity(mockLobby, mockLobby.maxCollaborators);
    }).toThrow('Lobby is full');
  });

  it('should not throw an error when current count is less than maxUsers', () => {
    expect(() => {
      LobbyService.validateCapacity(mockLobby, mockLobby.maxCollaborators - 1);
    }).not.toThrow();
  });
});
