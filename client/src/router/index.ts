import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import LobbiesView from '../views/LobbiesView.vue'
import PlayView from '../views/PlayView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { useUserStore } from '../stores/user.store'

import CreateLobbyView from '../views/CreateLobbyView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import ProfileView from '../views/ProfileView.vue'

const routes: RouteRecordRaw[] = [
    { path: '/', component: LoginView },
    { path: '/lobbies', component: LobbiesView, meta: { requiresAuth: true } },
    { path: '/create-lobby', component: CreateLobbyView, meta: { requiresAuth: true } },
    { path: '/notifications', component: NotificationsView, meta: { requiresAuth: true } },
    { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/play/:id', component: PlayView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', component: NotFoundView }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})

/**
 * Checks if user store state is corrupted (has token but missing required fields)
 */
function isUserStoreCorrupted(userStore: ReturnType<typeof useUserStore>): boolean {
    if (!userStore.token) return false
    return !userStore.username || !userStore.id
}

router.beforeEach((to, _from, next) => {
    const userStore = useUserStore()

    // Handle corrupted user store: logout and redirect to login
    if (isUserStoreCorrupted(userStore)) {
        userStore.logout()
        return next('/')
    }

    // Redirect authenticated users away from login page
    if (to.path === '/' && userStore.isAuthenticated) {
        return next('/lobbies')
    }

    if (to.meta.requiresAuth && !userStore.token) {
        return next('/')
    }

    if (to.meta.requiresAdmin && !userStore.isAdmin) {
        return next('/lobbies')
    }

    next()
})
