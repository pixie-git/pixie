import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const username: Ref<string> = ref('')

    function login(name: string): void {
        username.value = name
    }

    function logout(): void {
        username.value = ''
    }

    return { username, login, logout }
})
