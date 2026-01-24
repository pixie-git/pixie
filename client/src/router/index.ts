import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import PlayView from '../views/PlayView.vue'
import NotFound from '../views/NotFound.vue'
import { useUserStore } from '../stores/user'

const routes: RouteRecordRaw[] = [
    { path: '/', component: LoginView },
    { path: '/play', component: PlayView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', component: NotFound }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    if (to.meta.requiresAuth && !userStore.token) {
        next('/')
    } else {
        next()
    }
})
