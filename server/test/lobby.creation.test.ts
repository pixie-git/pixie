import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Lobby } from '../src/models/Lobby.js';
import { Canvas } from '../src/models/Canvas.js';

describe('Lobby Model - createWithCanvas Atomicity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not leave an orphaned Canvas if Lobby save fails', async () => {
    // 1. Mock Canvas.prototype.save to succeed
    const canvasSaveSpy = vi.spyOn(Canvas.prototype, 'save').mockResolvedValue({} as any);
    
    // 2. Mock Lobby.prototype.save to fail (e.g., duplicate name)
    const lobbySaveSpy = vi.spyOn(Lobby.prototype, 'save').mockRejectedValue(new Error('Duplicate name'));
    
    // 3. Mock Canvas.findByIdAndDelete for cleanup verification
    const canvasDeleteSpy = vi.spyOn(Canvas, 'findByIdAndDelete').mockResolvedValue({} as any);

    // Attempt creation
    try {
      await Lobby.createWithCanvas('Failing Lobby');
    } catch (error: any) {
      expect(error.message).toBe('Duplicate name');
    }

    // Verify it attempted to save both
    expect(canvasSaveSpy).toHaveBeenCalled();
    expect(lobbySaveSpy).toHaveBeenCalled();

    // MANDATORY: Check if cleanup was triggered
    expect(canvasDeleteSpy).toHaveBeenCalled();
  });
});
