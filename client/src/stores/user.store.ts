import { defineStore } from "pinia"
import { ref, computed, type Ref } from "vue"

export const useUserStore = defineStore("user", () => {
	const username: Ref<string> = ref(localStorage.getItem("username") || "")
	const token: Ref<string> = ref(localStorage.getItem("authToken") || "")
	const id: Ref<string> = ref(localStorage.getItem("userId") || "")
	const isAdmin: Ref<boolean> = ref(localStorage.getItem("isAdmin") === "true")

	function login(name: string, authToken: string, userId: string, admin: boolean): void {
		username.value = name
		token.value = authToken
		id.value = userId
		isAdmin.value = admin
		localStorage.setItem("username", name)
		localStorage.setItem("authToken", authToken)
		localStorage.setItem("userId", userId)
		localStorage.setItem("isAdmin", String(admin))

	}

	async function updateProfile(newUsername: string) {
		if (!id.value) return;
		// Import dynamically to avoid circular dependency if any, or move import to top if safe
		const api = await import('../services/api');

		const response = await api.updateUser(id.value, newUsername);
		const { username: name, token: newToken } = response.data;

		username.value = name;
		token.value = newToken;
		localStorage.setItem("username", name);
		localStorage.setItem("authToken", newToken);
	}

	function logout(): void {
		username.value = ""
		token.value = ""
		id.value = ""
		isAdmin.value = false
		localStorage.removeItem("username")
		localStorage.removeItem("authToken")
		localStorage.removeItem("userId")
		localStorage.removeItem("isAdmin")
	}

	const isAuthenticated = computed(() => !!token.value)

	return { username, token, id, isAdmin, isAuthenticated, login, logout, updateProfile }
})
