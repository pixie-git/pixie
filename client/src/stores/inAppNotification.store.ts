import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface InAppNotification {
    id: string;
    title: string;
    description: string;
    timeAgo: string;
    isRead: boolean;
}

export const useInAppNotificationStore = defineStore('inAppNotification', () => {
    const notifications = ref<InAppNotification[]>([
        {
            id: '1',
            title: 'JohnDoe commented on your post',
            description: '"Great work on the new pixel art piece! Love the colors."',
            timeAgo: '2 hours ago',
            isRead: true
        },
        {
            id: '2',
            title: 'AliceSmith invited you to collaborate on "Sunset Landscape"',
            description: 'You have a new invitation to collaborate on a project.',
            timeAgo: '5 hours ago',
            isRead: false
        },
        {
            id: '3',
            title: 'BobWilliams liked your "Cityscape" artwork',
            description: 'Your artwork "Cityscape" received a new like.',
            timeAgo: '1 day ago',
            isRead: true
        }
    ]);

    const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

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
        return Promise.resolve();
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications
    };
});
