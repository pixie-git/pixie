import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canvasStore } from '../store/canvas.store.js';
import { CanvasService } from './canvas.service.js';

describe('Canvas Single Pixel Write & Boundary Validation', () => {
    const LOBBY_ID = 'test-lobby';
    const WIDTH = 10;
    const HEIGHT = 10;

    beforeEach(() => {
        vi.clearAllMocks();
        // Clear out any previous state to ensure isolation
        canvasStore.removeLobby(LOBBY_ID);

        // Initialize a 10x10 zeroed out canvas
        const initialData = new Uint8Array(WIDTH * HEIGHT);
        canvasStore.loadLobbyToMemory(LOBBY_ID, WIDTH, HEIGHT, ['#000000', '#ffffff'], initialData);

        // Mock scheduleSave to prevent database calls and active timers during unit tests
        vi.spyOn(CanvasService as any, 'scheduleSave').mockImplementation(() => {});
    });

    it('should update the matrix correctly for valid coordinates', () => {
        const x = 5;
        const y = 5;
        const color = 1;

        const result = CanvasService.draw(LOBBY_ID, x, y, color);
        
        expect(result).toBe(true);
        
        const pixelData = canvasStore.getLobbyPixelData(LOBBY_ID);
        expect(pixelData).toBeDefined();
        
        const index = y * WIDTH + x;
        expect(pixelData![index]).toBe(color);
        expect(CanvasService['scheduleSave']).toHaveBeenCalledWith(LOBBY_ID);
    });

    it('should repeatedly return false for invalid coordinates outside bounds', () => {
        // Negative X
        expect(CanvasService.draw(LOBBY_ID, -1, 5, 1)).toBe(false);
        // Negative Y
        expect(CanvasService.draw(LOBBY_ID, 5, -1, 1)).toBe(false);

        // X equals / exceeds width
        expect(CanvasService.draw(LOBBY_ID, WIDTH, 5, 1)).toBe(false);
        expect(CanvasService.draw(LOBBY_ID, WIDTH + 1, 5, 1)).toBe(false);

        // Y equals / exceeds height
        expect(CanvasService.draw(LOBBY_ID, 5, HEIGHT, 1)).toBe(false);
        expect(CanvasService.draw(LOBBY_ID, 5, HEIGHT + 1, 1)).toBe(false);

        // Verify scheduleSave was never called because no valid draws occurred
        expect(CanvasService['scheduleSave']).not.toHaveBeenCalled();
    });
});
