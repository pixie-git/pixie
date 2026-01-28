<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/stores/editor.store';
import PixelCanvas from '@/components/editor/PixelCanvas.vue';
import ColorSelector from '@/components/editor/ColorSelector.vue';
import { useRoute } from 'vue-router';
import { getLobbyById } from '../services/api';

// Setup Store
const store = useEditorStore();
const { width, height, pixels, palette, selectedColorIndex, isConnected, pixelUpdateEvent } = storeToRefs(store);

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
</script>

<template>
  <div class="editor-layout">
    <!-- Header -->
    <header class="editor-header">
      <div class="header-left">
        <img src="@/assets/PixieLogo.png" alt="Pixie Logo" class="logo" />
      </div>
      <div class="header-center">
        <h1>Pixel Art Editor</h1>
      </div>
      <div class="header-right">
        <button class="icon-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </button>
        <button class="icon-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="editor-main">
      <!-- Left Sidebar (Desktop) / Bottom Bar (Mobile) -->
      <aside class="editor-sidebar">
        <ColorSelector />
        
        <button class="export-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export
        </button>

        <div class="user-avatar-container">
           <img src="@/assets/PixieLogo.png" alt="User" class="user-avatar" />
        </div>
      </aside>

      <!-- Center Canvas Area -->
      <section class="canvas-area">
        <div class="online-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
        
        <!-- Mobile Add Button -->
        <button class="mobile-add-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </section>
    </main>
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

/* Header */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.logo {
  height: 40px;
  width: auto;
}

.header-center h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 1rem;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  color: #333;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #f5f5f5;
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
}

.mobile-add-btn {
  display: none; /* Hidden on desktop */
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .editor-layout {
    height: 100vh;
    overflow: hidden;
  }

  .editor-header {
    padding: 1rem;
  }

  .header-center h1 {
    font-size: 1.2rem;
  }

  .editor-main {
    flex-direction: column;
  }

  .editor-sidebar {
    width: 100%;
    height: auto;
    flex-direction: row;
    justify-content: space-around;
    padding: 1rem;
    border-right: none;
    border-top: 1px solid #eee;
    order: 2; /* Move to bottom */
  }

  .export-btn {
    width: auto;
    padding: 10px 20px;
  }

  .user-avatar-container {
    margin-top: 0;
    align-self: center;
  }

  .canvas-area {
    order: 1;
    flex: 1;
  }

  .online-indicator {
    top: 10px;
    right: 10px;
  }

  .mobile-add-btn {
    display: flex;
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #3b82f6;
    color: white;
    border: none;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    z-index: 30;
  }
}
</style>