import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
    onClose?: () => void;
}

export const useToastStore = defineStore('toast', () => {
    const notifications = ref<Notification[]>([]);

    const add = (message: string, type: NotificationType = 'info', duration = 0, onClose?: () => void) => {
        const id = Date.now().toString();
        notifications.value.push({ id, message, type, duration, onClose });

        if (duration > 0) {
            setTimeout(() => {
                remove(id);
            }, duration);
        }
    };

    const remove = (id: string) => {
        const notification = notifications.value.find(n => n.id === id);
        if (notification && notification.onClose) {
            notification.onClose();
        }
        notifications.value = notifications.value.filter(n => n.id !== id);
    };

    return { notifications, add, remove };
});
