import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { useUserStore } from './user.store';
import * as api from '../services/api';


export interface InAppNotification {
    id: string;
    title: string;
    description: string;
    timeAgo: string;
    isRead: boolean;
}

export const useInAppNotificationStore = defineStore('inAppNotification', () => {
    const notifications = ref<InAppNotification[]>([]);

    const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
    const isMuted = ref(localStorage.getItem('notification_muted') === 'true');
    let eventSource: any = null;

    const markAsRead = async (id: string) => {
        const notification = notifications.value.find(n => n.id === id);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            try {
                await api.markNotificationAsRead(id);
            } catch (error) {
                console.error("Failed to mark notification as read", error);
                notification.isRead = false; // Revert on failure
            }
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        const unreadNotifications = notifications.value.filter(n => !n.isRead);
        notifications.value.forEach(n => n.isRead = true);

        try {
            await api.markAllNotificationsAsRead();
        } catch (error) {
            console.error("Failed to mark all as read", error);
            // Revert changes for those that were unread
            unreadNotifications.forEach(n => {
                const target = notifications.value.find(curr => curr.id === n.id);
                if (target) target.isRead = false;
            });
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.getNotifications();
            // Map backend naming to frontend naming if necessary, or ensure backend matches
            // Backend sends: _id, title, message, isRead, createdAt
            notifications.value = response.data.map((n: any) => ({
                id: n._id,
                title: n.title,
                description: n.message, // Map message to description
                timeAgo: new Date(n.createdAt).toLocaleTimeString(), // Simple formatting for now
                isRead: n.isRead
            }));
        } catch (error) {
            console.error("Failed to fetch notifications history", error);
        }
    };

    const toggleMute = () => {
        isMuted.value = !isMuted.value;
        localStorage.setItem('notification_muted', String(isMuted.value));

        if (isMuted.value) {
            disconnectSSE();
        } else {
            setupSSE();
        }
    };

    const setupSSE = () => {
        const userStore = useUserStore();
        const token = userStore.token || localStorage.getItem('authToken');

        if (!token) return;

        // Fetch history immediately, regardless of mute state
        fetchNotifications();

        // If muted, do not establish SSE connection
        if (isMuted.value) return;

        if (eventSource) {
            eventSource.close();
        }

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const url = `${baseUrl}/notifications/stream`;

        eventSource = new EventSourcePolyfill(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        eventSource.onopen = () => {
            console.log('[SSE] Connected to notification stream');
        };

        eventSource.onmessage = (event: any) => {
            // Heartbeat or simple message
            if (event.data === ': connected') return;

            console.log('[SSE] Message received:', event.data);
            try {
                const payload = JSON.parse(event.data);
                console.log('[SSE] Parsed payload:', payload);

                // Map payload to frontend structure
                const newNotification: InAppNotification = {
                    id: payload._id,
                    title: payload.title,
                    description: payload.message,
                    timeAgo: 'Just now',
                    isRead: payload.isRead
                };

                addNotification(newNotification);
            } catch (e) {
                console.error('[SSE] Failed to parse message', e);
            }
        };

        eventSource.onerror = () => {
            // Polyfill might error on re-connect attempts, usually safe to ignore or just log
        };
    };

    const addNotification = (notification: InAppNotification) => {
        // Prevent duplicates if history fetch and SSE overlap
        if (!notifications.value.find(n => n.id === notification.id)) {
            notifications.value.unshift(notification);
        }
    };

    const disconnectSSE = () => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
            console.log('[SSE] Disconnected');
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        setupSSE,
        disconnectSSE,
        isMuted,
        toggleMute
    };
});
