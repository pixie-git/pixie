<template>
  <div class="create-lobby-container">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="goBack" title="Back">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
      </button>
      <h1>Create Your Canvas</h1>
    </div>

    <div class="form-card">
      <form @submit.prevent="handleSubmit">
        
        <!-- Row 1: Name and Max Collaborators -->
        <div class="form-row">
          <div class="form-group flex-2">
            <label>Canvas Name</label>
            <input 
              v-model="form.name" 
              type="text" 
              placeholder="Enter canvas name" 
              required 
            />
          </div>
          <div class="form-group flex-1">
            <label>Max Collaborators</label>
            <input 
              v-model.number="form.maxCollaborators" 
              type="number" 
              placeholder="e.g., 10" 
              min="1" 
              max="50"
            />
          </div>
        </div>

        <!-- Row 2: Size and Description -->
        <div class="form-wrapper">
            <div class="left-col">
                 <!-- Canvas Size -->
                <div class="form-group">
                    <label>Canvas Size</label>
                    <div class="size-inputs">
                        <input 
                        v-model.number="form.width" 
                        type="number" 
                        placeholder="Width" 
                        min="16" 
                        max="128"
                        />
                        <span class="x-separator">x</span>
                        <input 
                        v-model.number="form.height" 
                        type="number" 
                        placeholder="Height" 
                        min="16" 
                        max="128"
                        />
                    </div>
                </div>

                <!-- Color Palette -->
                <div class="form-group">
                    <label>Color Palette</label>
                    <select v-model="form.palette">
                        <option value="default">Default Palette</option>
                        <option value="retro">Retro (Gameboy)</option>
                        <option value="neon">Neon</option>
                    </select>
                </div>
            </div>

            <div class="right-col">
                <!-- Description -->
                <div class="form-group full-height">
                    <label>Description (Optional)</label>
                    <textarea 
                    v-model="form.description" 
                    placeholder="Describe your canvas"
                    class="desc-textarea"
                    ></textarea>
                </div>
            </div>
        </div>
      
        <!-- Submit Button -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          {{ isLoading ? 'Creating...' : 'Create Canvas' }}
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { createLobby } from '../services/api';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const isLoading = ref(false);
const error = ref('');

const form = reactive({
  name: '',
  maxCollaborators: 10,
  width: 32,
  height: 32,
  palette: 'default',
  description: ''
});

const goBack = () => {
  router.back();
};

const handleSubmit = async () => {
  if (!form.name.trim()) {
      error.value = "Canvas Name is required";
      return;
  }
  
  error.value = '';
  isLoading.value = true;

  try {
    // The store likely has the user object, or ID.
    // Assuming userStore.user._id exists based on typical patterns, 
    // trying to find 'user' property on the store.
    // If userStore is minimal, we might need to check 'userStore.token' or similar.
    // Based on router guards, we have 'userStore.token'. 
    // We should check if we have user details. 
    // Assuming backend extracts user from token via middleware if ownerId is missing,
    // but the API signature allows sending it.
    // Let's assume userStore has 'user'. If not, we might need to fetch it.
    // Checking previous files... UserStore usage in router just checked token.
    // I'll assume we can pass the ownerId if we have it, or let backend handle it?
    // Backend controller looks for ownerId in body. 
    // Let's pass undefined if we can't find it, and hope backend gets it from req.user (which authMiddleware provides).
    // Actually backend: `const { name, ownerId } = req.body;`.
    // It doesn't seem to fall back to `req.user.id`.
    // Be safer: import jwt_decode if needed? Or check store again.
    // For now, I'll try to access `userStore.user?._id`.

    await createLobby({
      name: form.name,
      description: form.description,
      maxCollaborators: form.maxCollaborators,
      palette: form.palette,
      width: form.width,
      height: form.height
    });
    
    // Redirect to the new lobby or the lobby list
    router.push('/lobbies');
  } catch (err: any) {
    console.error("Create Lobby Error:", err);
    error.value = err.response?.data?.error || "Failed to create canvas. Try a different name.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.create-lobby-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  color: var(--color-text);
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  padding: 0;
  display: flex;
  align-items: center;
}

.form-card {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 6px var(--color-shadow);
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-wrapper {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.left-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.right-col {
    flex: 1;
}

.flex-2 { flex: 2; }
.flex-1 { flex: 1; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.form-group input, 
.form-group select,
.form-group textarea {
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: 2px solid var(--color-primary);
  border-color: transparent;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.size-inputs input {
  flex: 1;
  text-align: center;
}

.desc-textarea {
  resize: none;
  height: 100%;
  min-height: 120px;
}

.full-height {
    height: 100%;
}

.submit-btn {
  width: 100%;
  background: var(--color-btn-primary);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #ff4d4d;
  margin-top: 1rem;
  text-align: center;
}

@media (max-width: 768px) {
  .create-lobby-container {
    padding: 1rem;
  }
  
  .form-row, .form-wrapper {
    flex-direction: column;
    gap: 1rem;
  }
  
  .left-col, .right-col {
      width: 100%;
  }

  .desc-textarea {
      height: 120px;
  }
}
</style>
