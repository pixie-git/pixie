import { Schema, model, Document, Types } from 'mongoose';
import { CONFIG } from '../config.js';

export interface ICanvas extends Document {
  lobby: Types.ObjectId; // Back-link to Lobby (useful for maintenance)
  width: number;
  height: number;
  palette: string[];
  data: Buffer;
  lastModified: Date;
}

const canvasSchema = new Schema<ICanvas>({
  lobby: { type: Schema.Types.ObjectId, ref: 'Lobby', required: true },
  width: { type: Number, default: CONFIG.CANVAS.WIDTH },
  height: { type: Number, default: CONFIG.CANVAS.HEIGHT },
  palette: { type: [String], required: true },
  data: { type: Buffer, required: true },
  lastModified: { type: Date, default: Date.now }
});

export const Canvas = model<ICanvas>('Canvas', canvasSchema);