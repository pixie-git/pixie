<script setup lang="ts">
import { onMounted, computed, ref, watch, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCanvasStore } from '@/stores/canvas.store';
import { useLobbyStore } from '@/stores/lobby.store';
import { useUserStore } from '@/stores/user.store';
import { useModalStore } from '@/stores/modal.store';
import PixelCanvas from '@/components/editor/PixelCanvas.vue';
import ColorSelector from '@/components/editor/ColorSelector.vue';
import MobileNavBar from '@/components/lobbies/MobileNavBar.vue';
import LobbyHeader from '@/components/lobbies/LobbyHeader.vue';
import UserListPanel from '@/components/lobbies/UserListPanel.vue';
import { useRoute, useRouter } from 'vue-router';
import { getLobbyById, exportLobbyImage, kickUser, banUser, getBannedUsers, unbanUser, type BannedUser } from '../services/api';
import { socketService } from '@/services/socket.service';
import { DISCONNECT_REASONS } from '../constants/disconnect.constants';

// Setup Store
const canvasStore = useCanvasStore();
const { width, height, pixels, palette, pixelUpdateEvent } = storeToRefs(canvasStore);
const lobbyStore = useLobbyStore();
const { users, disconnectReason, lobbyId } = storeToRefs(lobbyStore);
const userStore = useUserStore();
const modalStore = useModalStore();

const route = useRoute();
const router = useRouter();

const lobbyOwnerId = ref<string>('');
const bannedUsers = ref<BannedUser[]>([]);
const hasLobbyPermissions = computed(() => {
  return !!(userStore.isAdmin || (userStore.id && lobbyOwnerId.value === userStore.id));
});

// Watch for force disconnect and navigate to lobbies
watch(disconnectReason, async (reason) => {
  if (reason) {
    console.log('[PlayView] Force disconnected. Reason:', reason);
    
    let title = 'Disconnected';
    let message = 'You have been disconnected from the lobby.';
    let type: 'info' | 'warning' | 'danger' = 'info';

    if (reason === DISCONNECT_REASONS.BANNED) {
      title = 'Banned';
      message = 'You have been banned from this lobby.';
      type = 'danger';
    } else if (reason === DISCONNECT_REASONS.KICKED) {
      title = 'Kicked';
      message = 'You have been kicked from this lobby.';
      type = 'warning';
    }

    // Wait for user to acknowledge
    await modalStore.confirm({
      title,
      message,
      confirmText: 'OK',
      type,
      hideCancel: true
    });

    router.push('/lobbies');
  }
});

const handleExport = async () => {
  const lobbyId = route.params.id as string;
  if (!lobbyId) return;

  try {
    const response = await exportLobbyImage(lobbyId, 1);
    
    // Create blob link to download
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    
    // Suggest a filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `lobby-${lobbyId}-${timestamp}.png`);
    
    // Append link element to page
    document.body.appendChild(link);
    
    // Start download
    link.click();
    
    // Clean up and remove the link
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to export image", e);
  }
};

const handleCreateNew = () => {
  router.push('/create-lobby');
};

const handleClear = async () => {
  const confirmed = await modalStore.confirm({
    title: 'Clear Canvas',
    message: 'Are you sure you want to clear the entire canvas? This cannot be undone.',
    confirmText: 'Clear',
    type: 'danger'
  });

  if (confirmed) {
    canvasStore.clearLobby();
  }
};

const handleKickUser = async (userId: string) => {
  const lobbyId = route.params.id as string;
  try {
    await kickUser(lobbyId, userId);
    // Socket will handle list update
  } catch (e) {
    console.error("Failed to kick user:", e);
  }
};

const handleBanUser = async (userId: string) => {
  const lobbyId = route.params.id as string;
  try {
    await banUser(lobbyId, userId);
    // Socket will handle banned users list update
  } catch (e) {
    console.error("Failed to ban user:", e);
  }
};

const handleUnbanUser = async (userId: string) => {
  const lobbyId = route.params.id as string;
  try {
    await unbanUser(lobbyId, userId);
    // Socket will handle banned users list update
  } catch (e) {
    console.error("Failed to unban user:", e);
  }
};

const fetchBannedUsers = async () => {
  const lobbyId = route.params.id as string;
  if (!lobbyId || !hasLobbyPermissions.value) return;
  try {
    const res = await getBannedUsers(lobbyId, { skipGlobalErrorHandler: true });
    bannedUsers.value = res.data;
  } catch (e) {
    // Silently fail - user might not have permissions yet
  }
};


const lobbyNameDisplay = ref<string>('');

onMounted(async () => {
  const lobbyId = route.params.id as string;
  let resolvedLobbyName = 'Lobby';

  if (!lobbyId) {
    router.push('/lobbies');
    return;
  }

  // 1. Fetch Lobby Details (for name & ownership)
  try {
    const res = await getLobbyById(lobbyId, { skipGlobalErrorHandler: true });
    resolvedLobbyName = res.data.name;
    // Set for display
    lobbyNameDisplay.value = resolvedLobbyName;
    
    if (res.data.owner && res.data.owner._id) {
        lobbyOwnerId.value = res.data.owner._id;
    }
  } catch (e: any) {
    if (e.response && e.response.status === 403) {
      // Ban detected - Notification is handled globally by api.ts
      console.warn("User is banned from this lobby.");
      
      await modalStore.confirm({
        title: 'Access Denied',
        message: 'You are banned from this lobby.',
        confirmText: 'OK',
        type: 'danger',
        hideCancel: true
      });
      
      router.push('/lobbies');
      return; // Stop initialization
    }
    // If 404/Other, user will likely be redirected anyway or see generic error
  }
  
  // Initialize stores with ID
  // Order matters: lobby store connects socket, canvas store listens to events
  lobbyStore.joinLobby(lobbyId);
  canvasStore.init(lobbyId);

  // Fetch banned users if user has permissions
  await fetchBannedUsers();

  // Listen for real-time banned users updates only when user has lobby permissions
  if (hasLobbyPermissions.value) {
    socketService.onBannedUsersUpdated(() => {
      fetchBannedUsers();
    });
  } else {
    // Ensure non-moderator clients do not retain banned users data
    bannedUsers.value = [];
  }
});

onUnmounted(() => {
  lobbyStore.leaveLobby();
  canvasStore.reset();
});
</script>

<template>
  <div class="editor-layout">
    <!-- Header -->
    <LobbyHeader :title="lobbyNameDisplay || lobbyId" />

    <!-- Main Content -->
    <main class="editor-main">
      <!-- Left Sidebar (Desktop) / Bottom Content (Mobile) -->
      <aside class="editor-sidebar">
        <div class="sidebar-controls">
          <!-- Color Selector -->
          <div class="sidebar-group">
             <ColorSelector />
          </div>
          
          <!-- Clear Canvas and Export Group -->
          <div class="sidebar-actions-row">
              <!-- Clear Canvas Button (Owner/Admin only) -->
              <button v-if="hasLobbyPermissions" class="clear-btn" @click="handleClear">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Clear
              </button>
              
              <!-- Export Button -->
              <button class="export-btn" @click="handleExport">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>
                Export
              </button>
          </div>
  
        </div>

          <!-- Create New Button -->
          <button class="create-btn" @click="handleCreateNew">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Lobby
          </button>

      </aside>

      <!-- Center Canvas Area -->
      <section class="canvas-area">
        <div class="canvas-container">
            <PixelCanvas
              :width="width"
              :height="height"
              :pixels="pixels"
              :palette="palette"
              :pixel-update-event="pixelUpdateEvent"
              :initial-zoom="10"
              @stroke-start="({x, y}) => canvasStore.startStroke(x, y)"
              @stroke-move="({x, y}) => canvasStore.continueStroke(x, y)"
              @stroke-end="canvasStore.endStroke()"
            />
        </div>
        <UserListPanel 
          :users="users" 
          :banned-users="bannedUsers"
          :can-moderate="hasLobbyPermissions"
          :owner-id="lobbyOwnerId"
          @kick="handleKickUser"
          @ban="handleBanUser"
          @unban="handleUnbanUser"
        />
      </section>
    </main>

    <!-- Bottom Navigation Bar (Mobile Only) -->
    <MobileNavBar />
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: 'Inter', sans-serif;
}

/* Main Layout */
.editor-main {
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Sidebar */
.editor-sidebar {
  width: 250px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  z-index: 10;
}

/* Sidebar Controls Wrapper */
.sidebar-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: fit-content; /* Allow container to shrink to widest child (Palette) */
  margin: 0 auto; /* Center in sidebar */
}

.sidebar-group {
  width: 100%;
  display: flex;
  justify-content: center;
}

.sidebar-actions-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #a855f7; /* Purple */
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  justify-content: center;
  width: 100%;
}

.export-btn:hover {
  background-color: #9333ea;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #10b981; /* Emerald 500 */
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  justify-content: center;
  margin-top: auto;
}

.create-btn:hover {
  background-color: #059669; /* Emerald 600 */
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #ef4444; /* Red 500 */
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  justify-content: center;
  width: 100%;
}

.clear-btn:hover {
  background-color: #dc2626; /* Red 600 */
}

.user-avatar-container {
  margin-top: auto;
  align-self: flex-start;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  font-weight: 600;
  color: #333;
  z-index: 20;
}

.canvas-area {
  flex: 1;
  position: relative;
  background-color: var(--color-canvas-bg);
  overflow: hidden;
  display: flex; /* NEW: Flex layout for side-by-side */
}



.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  box-shadow: 0 0 30px var(--color-shadow);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Utilities */
.mobile-hidden {
  display: block;
}

.desktop-only {
  display: block;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .editor-layout {
    height: 100vh;
    overflow: hidden;
  }
  
  .header-left.mobile-hidden {
    display: none;
  }

  .header-center h1 {
    font-size: 1.2rem;
  }
  
  .header-right {
    position: absolute;
    right: 1rem;
  }
  
  .desktop-only {
    display: none;
  }

  .editor-main {
    flex-direction: column;
    overflow-y: auto; /* Allow scrolling if needed, though we try to fit */
    padding-bottom: 70px; /* Space for MobileNavBar */
  }

  .sidebar-controls {
    width: 100%;
    margin: 0;
    gap: 1rem;
  }

  .editor-sidebar {
    width: 100%;
    height: auto;
    flex-direction: column;
    padding: 1rem 2rem;
    border-right: none;
    border-top: none;
    order: 2; /* Move to bottom */
    background: transparent;
    gap: 0; /* Let sidebar-controls handle gap */
  }
  
  .sidebar-actions-row {
    flex-direction: row;
  }
  
  .export-btn, .clear-btn {
    flex: 1;
  }
  
  .sidebar-group {
    width: 100%;
    overflow-x: auto; /* Allow horizontal scroll for palette if needed */
    display: flex;
    justify-content: center;
  }

  .export-btn {
    padding: 14px;
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
  }
  
  .create-btn {
    display: none;
  }

  .canvas-area {
    order: 1;
    flex: 1; /* Take remaining space */
    min-height: 40vh; /* Ensure it doesn't shrink too much */
    background: transparent;
    display: flex; /* Flex row to hold canvas + userlist */
    padding: 0; /* Maximize space */
    position: relative;
    width: 100%; 
    overflow: hidden; /* Prevent spill */
  }

  .canvas-container {
      width: 100%;
      height: 100%;
      position: relative;
  }
  
  .canvas-wrapper {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
    width: 100%;
    height: 100%;
    /* Removed max-width/height limits to fill space */
    box-shadow: none; /* Cleaner look on mobile or keep it? Design shows simple box */
    border: 1px solid var(--color-border);
  }


}
</style>