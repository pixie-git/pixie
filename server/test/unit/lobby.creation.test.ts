import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Lobby } from '../../src/models/Lobby.js';
import { Canvas } from '../../src/models/Canvas.js';

describe('Lobby Model - createWithCanvas Atomicity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not leave an orphaned Canvas if Lobby save fails', async () => {
    let capturedCanvasId: any;

    // 1. Mock Canvas.prototype.save to capture the ID and succeed
    const canvasSaveSpy = vi.spyOn(Canvas.prototype, 'save').mockImplementation(function (this: any) {
      capturedCanvasId = this._id;
      return Promise.resolve(this);
    });
    
    // 2. Mock Lobby.prototype.save to fail (e.g., duplicate name)
    const lobbySaveSpy = vi.spyOn(Lobby.prototype, 'save').mockRejectedValue(new Error('Duplicate name'));
    
    // 3. Mock Canvas.findByIdAndDelete for cleanup verification
    const canvasDeleteSpy = vi.spyOn(Canvas, 'findByIdAndDelete').mockResolvedValue({} as any);

    // Attempt creation
    await expect(Lobby.createWithCanvas('Failing Lobby')).rejects.toThrow('Duplicate name');

    // Verify it attempted to save both
    expect(canvasSaveSpy).toHaveBeenCalled();
    expect(lobbySaveSpy).toHaveBeenCalled();

    // MANDATORY: Check if cleanup was triggered for the EXACT canvas ID
    expect(capturedCanvasId).toBeDefined();
    expect(canvasDeleteSpy).toHaveBeenCalledWith(capturedCanvasId);
  });
});
