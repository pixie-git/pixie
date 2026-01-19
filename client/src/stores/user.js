import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const username = ref('')

    function login(name) {
        username.value = name
    }

    function logout() {
        username.value = ''
    }

    return { username, login, logout }
})
