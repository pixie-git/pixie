<template>
	<div class="login-container">
		<div class="login-card">
			<img src="@/assets/PixieLogo.jpeg" alt="Pixie Logo" class="logo" />
			<h1>Benvenuto in Pixie</h1>

			<Transition name="message">
				<div v-if="message" :class="['message', `message-${messageType}`]">
					{{ message }}
				</div>
			</Transition>

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

<script setup lang="ts">
import { ref } from "vue"
import { router } from "../router"
import api from "../services/api"
import { useUserStore } from "../stores/user"

const username = ref("")
const userStore = useUserStore()
const message = ref("")
const messageType = ref<"success" | "error">("success")

interface LoginResponse {
	username: string
	id: string
	token: string
	isNewUser: boolean
}

const handleLogin = async () => {
	if (!username.value.trim()) return

	message.value = ""

	try {
		const response = await api.post<LoginResponse>("/login", {
			username: username.value,
		})

		// Server returns { username, id, token, isNewUser }
		if (response.data.isNewUser) {
			message.value = `✨ Nuovo utente "${response.data.username}" creato con successo!`
			messageType.value = "success"
			setTimeout(() => {
				userStore.login(response.data.username, response.data.token)
			router.push("/lobbies")
			}, 2000)
		} else {
			userStore.login(response.data.username, response.data.token)
			router.push("/lobbies")
		}
	} catch (error) {
		console.error("Login failed:", error)
		message.value = "❌ Errore durante il login. Controlla che il server sia attivo."
		messageType.value = "error"
	}
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

.message {
	padding: 14px 16px;
	border-radius: 8px;
	font-size: 0.95rem;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 10px;
	animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.message-success {
	background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(56, 142, 60, 0.1));
	border: 1px solid #4caf50;
	border-left: 4px solid #4caf50;
	color: #2e7d32;
}

.message-error {
	background: linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(211, 47, 47, 0.1));
	border: 1px solid #f44336;
	border-left: 4px solid #f44336;
	color: #c62828;
}

.message-enter-active,
.message-leave-active {
	transition: all 0.3s ease;
}

.message-enter-from {
	opacity: 0;
	transform: translateY(-10px);
}

.message-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
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
