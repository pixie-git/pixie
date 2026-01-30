import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import LobbiesView from '../views/LobbiesView.vue'
import PlayView from '../views/PlayView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { useUserStore } from '../stores/user.store'

import CreateLobbyView from '../views/CreateLobbyView.vue'
import NotificationsView from '../views/NotificationsView.vue'

const routes: RouteRecordRaw[] = [
    { path: '/', component: LoginView },
    { path: '/lobbies', component: LobbiesView, meta: { requiresAuth: true } },
    { path: '/create-lobby', component: CreateLobbyView, meta: { requiresAuth: true } },
    { path: '/notifications', component: NotificationsView, meta: { requiresAuth: true } },
    { path: '/play/:id', component: PlayView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', component: NotFoundView }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, _from, next) => {
    const userStore = useUserStore()

    if (to.meta.requiresAuth && !userStore.token) {
        return next('/')
    }

    if (to.meta.requiresAdmin && !userStore.isAdmin) {
        return next('/lobbies')
    }

    next()
})
