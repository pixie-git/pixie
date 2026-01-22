import { Schema, model, Document, Types } from 'mongoose';

export interface ICanvas extends Document {
  lobby: Types.ObjectId; // Back-link to Lobby (useful for maintenance)
  width: number;
  height: number;
  data: Buffer;
  lastModified: Date;
}

const canvasSchema = new Schema<ICanvas>({
  lobby: { type: Schema.Types.ObjectId, ref: 'Lobby', required: true },
  width: { type: Number, default: 64 },
  height: { type: Number, default: 64 },
  data: { type: Buffer, required: true },
  lastModified: { type: Date, default: Date.now }
});

export const Canvas = model<ICanvas>('Canvas', canvasSchema);