import { defineStore } from "pinia"
import { ref, type Ref } from "vue"

export const useUserStore = defineStore("user", () => {
	const username: Ref<string> = ref(localStorage.getItem("username") || "")
	const token: Ref<string> = ref(localStorage.getItem("authToken") || "")

	function login(name: string, authToken: string): void {
		username.value = name
		token.value = authToken
		localStorage.setItem("username", name)
		localStorage.setItem("authToken", authToken)
	}

	function logout(): void {
		username.value = ""
		token.value = ""
		localStorage.removeItem("username")
		localStorage.removeItem("authToken")
	}

	return { username, token, login, logout }
})
