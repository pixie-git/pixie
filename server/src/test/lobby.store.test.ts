import { describe, it, expect, beforeEach } from 'vitest';
import { LobbyStore } from '../store/lobby.store.js';

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

    expect(bufferA[0]).toBe(0);
    expect(bufferB[0]).toBe(0);

    store.setPixel(idLobbyA, 0, 99);

    expect(bufferA[0]).toBe(99);
    expect(bufferB[0]).toBe(0);
  });

});
