import { defineStore } from 'pinia';
import { ref } from 'vue';
import { socketService } from '@/services/socket.service';

export interface User {
  id: string;
  username: string;
}

export const useLobbyStore = defineStore('lobby', () => {
  const users = ref<User[]>([]);
  const lobbyName = ref<string>('');
  const isConnected = ref(false);
  const disconnectReason = ref<string | null>(null);

  const joinLobby = (name: string) => {
    lobbyName.value = name;
    disconnectReason.value = null; // Reset on new join

    socketService.connect();

    socketService.onConnect(() => {
      isConnected.value = true;
      if (lobbyName.value) {
        console.log('[LobbyStore] Socket connected, joining lobby:', lobbyName.value);
        socketService.emitJoinLobby(lobbyName.value);
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
  };

  const leaveLobby = () => {
    socketService.disconnect();
    isConnected.value = false;
    users.value = [];
    lobbyName.value = '';
  };

  return {
    users,
    lobbyName,
    isConnected,
    disconnectReason,
    joinLobby,
    leaveLobby
  };
});
