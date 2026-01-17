<template>
  <div class="login-container">
    <div class="login-card">
      <img src="@/assets/PixieLogo.jpeg" alt="Pixie Logo" class="logo" />
      <h1>Benvenuto in Pixie</h1>
      <form @submit.prevent="handleLogin">
        <input 
          v-model="username" 
          type="text" 
          placeholder="Inserisci il tuo nome..." 
          required 
          class="username-input"
        />
        <button type="submit" class="login-button">Entra</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { LoginController } from '../controllers/LoginController'

const username = ref('')

const handleLogin = () => {
    LoginController.login(username.value)
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
}

.login-card {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
}

.logo {
  width: 100px;
  height: auto;
  margin: 0 auto;
  object-fit: contain;
}

h1 {
  font-size: 1.5rem;
  margin: 0;
}

.username-input {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid var(--color-border);
  background-color: var(--color-input-bg);
  color: var(--color-text);
  font-size: 1rem;
  box-sizing: border-box; /* Ensures padding doesn't affect width */
}

.username-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.login-button {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: var(--color-primary);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: var(--color-primary-hover);
}
</style>
