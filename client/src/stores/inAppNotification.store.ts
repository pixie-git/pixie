import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { useUserStore } from './user.store';


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
    let eventSource: any = null;

    const markAsRead = (id: string) => {
        const notification = notifications.value.find(n => n.id === id);
        if (notification) {
            notification.isRead = true;
        }
    };

    const markAllAsRead = () => {
        notifications.value.forEach(n => n.isRead = true);
    };

    const fetchNotifications = async () => {
        // actionable: simulate API call
        return Promise.resolve();
    };

    const setupSSE = () => {
        const userStore = useUserStore();
        const token = userStore.token || localStorage.getItem('token');

        if (!token) return;

        if (eventSource) {
            eventSource.close();
        }

        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/stream`;

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
                addNotification(payload);
            } catch (e) {
                console.error('[SSE] Failed to parse message', e);
            }
        };

        eventSource.onerror = () => {
            // console.error('[SSE] Error:', error);
            // Polyfill might error on re-connect attempts, usually safe to ignore or just log
        };
    };

    const addNotification = (notification: InAppNotification) => {
        notifications.value.unshift(notification);
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
        disconnectSSE
    };
});
