import { PNG } from 'pngjs';
import { CanvasService } from './canvas.service.js';

export class ImageService {
  static async generateLobbyPng(lobbyName: string): Promise<PNG> {
    const { width, height, palette, data } = await CanvasService.getState(lobbyName);

    const png = new PNG({ width, height });

    // Pre-calculate RGB values from hex palette
    const rgbPalette = palette.map(hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    });

    // Populate PNG buffer
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pngIdx = (y * width + x) << 2;
        const colorIdx = data[y * width + x];
        const [r, g, b] = rgbPalette[colorIdx] || [0, 0, 0];

        png.data[pngIdx] = r;
        png.data[pngIdx + 1] = g;
        png.data[pngIdx + 2] = b;
        png.data[pngIdx + 3] = 255;
      }
    }

    return png;
  }
}
