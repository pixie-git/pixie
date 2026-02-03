import { Schema, model, Document, Types, Model } from 'mongoose';
import { Canvas } from './Canvas.js';
import { CONFIG } from '../config.js';

export interface ILobby extends Document {
  name: string;
  description?: string;
  maxCollaborators: number;
  owner?: Types.ObjectId; // Links to your User schema
  canvas: Types.ObjectId; // Links to Canvas schema
  allowedUsers: Types.ObjectId[];
  bannedUsers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Static method interface
interface LobbyModel extends Model<ILobby> {
  createWithCanvas(name: string, ownerId?: string, options?: {
    description?: string;
    maxCollaborators?: number;
    palette?: string[];
    width?: number;
    height?: number;
  }): Promise<ILobby>;
}

const lobbySchema = new Schema<ILobby>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: { type: String, maxlength: 500 },
  maxCollaborators: { type: Number, default: 10, min: 1, max: 50 },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  canvas: { type: Schema.Types.ObjectId, ref: 'Canvas', required: true },
  allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  bannedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// --- FACTORY METHOD: Creates Lobby + Empty Canvas atomically ---
lobbySchema.statics.createWithCanvas = async function (name: string, ownerId?: string, options = {}) {
  const {
    description,
    maxCollaborators = 10,
    palette = ['#FFFFFF', '#000000'], // Default fallback if not provided
    width = CONFIG.CANVAS.WIDTH,
    height = CONFIG.CANVAS.HEIGHT
  } = options;

  const lobbyId = new Types.ObjectId();
  const canvasId = new Types.ObjectId();

  // Initialized to 0 (Transparent/White depending on palette)
  const emptyBuffer = Buffer.alloc(width * height, 0);

  const canvas = new Canvas({
    _id: canvasId,
    lobby: lobbyId,
    width: width,
    height: height,
    palette: palette,
    data: emptyBuffer
  });

  const lobby = new this({
    _id: lobbyId,
    name,
    description,
    maxCollaborators,
    owner: ownerId ? new Types.ObjectId(ownerId) : undefined,
    canvas: canvasId
  });

  // Save both
  await Promise.all([canvas.save(), lobby.save()]);
  return lobby;
};

export const Lobby = model<ILobby, LobbyModel>('Lobby', lobbySchema);