import { PNG } from 'pngjs';
import { CanvasService } from './canvas.service.js';

export class ImageService {
  static async generateLobbyPng(lobbyId: string, scale: number = 1): Promise<PNG> {
    const { width, height, palette, data } = await CanvasService.getState(lobbyId);

    // Validate scale to prevent memory issues
    const validScale = Math.max(1, Math.min(Math.floor(scale), 10)); // Clamp between 1 and 10
    const scaledWidth = width * validScale;
    const scaledHeight = height * validScale;

    const png = new PNG({ width: scaledWidth, height: scaledHeight });

    // Pre-calculate RGB values from hex palette
    const rgbPalette = palette.map(hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    });

    // Populate PNG buffer with Nearest-Neighbor Scaling
    for (let y = 0; y < scaledHeight; y++) {
      const srcY = Math.floor(y / validScale);
      for (let x = 0; x < scaledWidth; x++) {
        const srcX = Math.floor(x / validScale);

        const colorIdx = data[srcY * width + srcX];
        const [r, g, b] = rgbPalette[colorIdx] || [0, 0, 0];

        const pngIdx = (y * scaledWidth + x) << 2;
        png.data[pngIdx] = r;
        png.data[pngIdx + 1] = g;
        png.data[pngIdx + 2] = b;
        png.data[pngIdx + 3] = 255;
      }
    }

    return png;
  }
}
