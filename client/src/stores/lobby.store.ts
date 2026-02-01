import { defineStore } from 'pinia';
import { ref } from 'vue';
import { socketService } from '@/services/socket.service';
import { DISCONNECT_REASONS } from '../constants/disconnect.constants';

export interface User {
  id: string;
  username: string;
}

export const useLobbyStore = defineStore('lobby', () => {
  const users = ref<User[]>([]);
  const lobbyId = ref<string>('');
  const isConnected = ref(false);
  const disconnectReason = ref<string | null>(null);

  const joinLobby = (id: string) => {
    lobbyId.value = id;
    disconnectReason.value = null; // Reset on new join

    socketService.connect();

    socketService.onConnect(() => {
      isConnected.value = true;
      if (lobbyId.value) {
        console.log('[LobbyStore] Socket connected, joining lobby:', lobbyId.value);
        socketService.emitJoinLobby(lobbyId.value);
      }
    });

    // Listen for initial user list
    socketService.onLobbyUsers<User>((userList) => {
      users.value = userList;
    });

    // Listen for new user joining
    socketService.onUserJoined<User>((user) => {
      // Avoid duplicates
      if (!users.value.find(u => u.id === user.id)) {
        users.value.push(user);
      }
    });

    // Listen for user leaving
    socketService.onUserLeft<User>((user) => {
      users.value = users.value.filter(u => u.id !== user.id);
    });

    // Handle forced disconnection (kicked, banned, duplicate session, etc.)
    socketService.onForceDisconnect((data) => {
      console.log('[LobbyStore] Force disconnected:', data.reason);
      disconnectReason.value = data.reason;
      leaveLobby();
    });

    // Handle generic socket errors (e.g. join failed)
    socketService.onError((data) => {
      console.error('[LobbyStore] Socket error:', data.message);
      if (data.message === DISCONNECT_REASONS.BANNED || data.message.includes('Access denied')) {
        disconnectReason.value = DISCONNECT_REASONS.BANNED;
        leaveLobby();
      } else if (data.message.includes('Lobby is full')) {
        // Could handle full lobby specifically if needed, likely handled by UI error toast
      }
    });
  };

  const leaveLobby = () => {
    socketService.disconnect();
    isConnected.value = false;
    users.value = [];
    lobbyId.value = '';
  };

  return {
    users,
    lobbyId,
    isConnected,
    disconnectReason,
    joinLobby,
    leaveLobby
  };
});
