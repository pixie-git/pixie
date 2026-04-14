import { describe, it, expect, beforeEach } from 'vitest';
import { LobbyStore } from '../../src/store/lobby.store.js';

describe('LobbyStore - Data Isolation', () => {
  let store: LobbyStore;

  beforeEach(() => {
    store = new LobbyStore();
  });

  it('should not alter the state matrix of another lobby when drawing a pixel in a lobby', () => {
    const idLobbyA = 'lobby_alpha';
    const idLobbyB = 'lobby_beta';

    const bufferA = store.getLobbyBuffer(idLobbyA);
    const bufferB = store.getLobbyBuffer(idLobbyB);

    for (let i = 0; i < bufferA.length; i++) {
      store.setPixel(idLobbyA, i, 99);
    }

    const isLobbyAColorata = bufferA.every(pixel => pixel === 99);
    expect(isLobbyAColorata).toBe(true);

    const isLobbyBPulita = bufferB.every(pixel => pixel === 0);
    expect(isLobbyBPulita).toBe(true);
  });
});
