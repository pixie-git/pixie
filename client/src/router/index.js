import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import PlayView from '../views/PlayView.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
    { path: '/', component: LoginView },
    { path: '/play', component: PlayView },
    { path: '/:pathMatch(.*)*', component: NotFound }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})
