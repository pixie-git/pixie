<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/stores/editor.store';
import PixelCanvas from '@/components/editor/PixelCanvas.vue';
import ColorSelector from '@/components/editor/ColorSelector.vue';
import MobileNavBar from '@/components/lobbies/MobileNavBar.vue';
import LobbyHeader from '@/components/lobbies/LobbyHeader.vue';
import { useRoute } from 'vue-router';
import { getLobbyById } from '../services/api';
import { onUnmounted } from 'vue';

// Setup Store
const store = useEditorStore();
const { width, height, pixels, palette, pixelUpdateEvent } = storeToRefs(store);

const route = useRoute();

onMounted(async () => {
  const lobbyId = route.params.id as string;
  let lobbyName = 'Default Lobby';

  if (lobbyId) {
    if (/^[0-9a-fA-F]{24}$/.test(lobbyId)) {
      try {
        const res = await getLobbyById(lobbyId);
        lobbyName = res.data.name;
      } catch (e) {
        console.error("Failed to load lobby by ID", e);
      }
    } else {
      lobbyName = lobbyId;
    }
  }

  store.init(lobbyName);
});

onUnmounted(() => {
  store.cleanup();
});
</script>

<template>
  <div class="editor-layout">
    <!-- Header -->
    <LobbyHeader :title="'Pixel Art Editor'" />

    <!-- Main Content -->
    <main class="editor-main">
      <!-- Left Sidebar (Desktop) / Bottom Content (Mobile) -->
      <aside class="editor-sidebar">
        <!-- Color Selector -->
        <div class="sidebar-group">
           <ColorSelector />
        </div>
        
        <!-- Export Button -->
        <button class="export-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>
          Export
        </button>

      </aside>

      <!-- Center Canvas Area -->
      <section class="canvas-area">
        <div class="online-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>5</span> <!-- Placeholder for online count -->
        </div>

        <div class="canvas-wrapper">
          <PixelCanvas
            :width="width"
            :height="height"
            :pixels="pixels"
            :palette="palette"
            :pixel-update-event="pixelUpdateEvent"
            :initial-zoom="10"
            @stroke-start="({x, y}) => store.startStroke(x, y)"
            @stroke-move="({x, y}) => store.continueStroke(x, y)"
            @stroke-end="store.endStroke()"
          />
        </div>
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
  background-color: #fff;
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
  border-right: 1px solid #eee;
  background: #fff;
  z-index: 10;
}

.sidebar-group {
  width: 100%;
  display: flex;
  justify-content: center;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #a855f7; /* Purple */
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  justify-content: center;
}

.export-btn:hover {
  background-color: #9333ea;
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

/* Canvas Area */
.canvas-area {
  flex: 1;
  position: relative;
  background-color: #f8f9fa;
  overflow: hidden;
}

.online-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
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

.canvas-wrapper {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  box-shadow: 0 0 30px rgba(0,0,0,0.1);
  background: white;
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

  .editor-sidebar {
    width: 100%;
    height: auto;
    flex-direction: column;
    padding: 1rem 2rem;
    border-right: none;
    border-top: none;
    order: 2; /* Move to bottom */
    background: transparent;
    gap: 1rem;
  }
  
  .sidebar-group {
    width: 100%;
    overflow-x: auto; /* Allow horizontal scroll for palette if needed */
    display: flex;
    justify-content: center;
  }

  .export-btn {
    width: 100%;
    padding: 14px;
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
  }

  .canvas-area {
    order: 1;
    flex: none; /* Don't take all space, let it be sized by content/height */
    height: 50vh; /* Dedicate top half to canvas */
    background: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
  }
  
  .canvas-wrapper {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
    width: 100%;
    height: 100%;
    max-width: 350px; /* Limit width on mobile */
    max-height: 350px;
    box-shadow: none; /* Cleaner look on mobile or keep it? Design shows simple box */
    border: 1px solid #eee;
  }

  .online-indicator {
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    font-size: 0.9rem;
    border: 1px solid #eee;
  }
}
</style>