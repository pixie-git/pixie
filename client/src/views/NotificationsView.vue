<template>
  <div class="notifications-container">
    <div class="header">
        <button class="back-btn" @click="$router.back()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
        </button>
        <h1>Notifications</h1>
    </div>

    <div class="tabs">
        <button 
            :class="{ active: currentTab === 'all' }" 
            @click="currentTab = 'all'"
        >
            All
        </button>
        <button 
            :class="{ active: currentTab === 'unread' }" 
            @click="currentTab = 'unread'"
        >
            Unread
        </button>
    </div>

    <div class="notification-list">
        <div 
            v-for="notification in filteredNotifications" 
            :key="notification.id" 
            class="notification-item"
            :class="{ unread: !notification.isRead }"
            @click="markAsRead(notification.id)"
        >
            <div class="notification-content">
                <h3 class="notif-title">{{ notification.title }}</h3>
                <p class="notif-desc">{{ notification.description }}</p>
                <span class="notif-time">{{ notification.timeAgo }}</span>
            </div>
        </div>
        
        <div v-if="filteredNotifications.length === 0" class="empty-state">
            <p>No notifications found.</p>
        </div>
    </div>

    <div class="actions" v-if="notifications.length > 0">
        <button class="mark-all-btn" @click="store.markAllAsRead">
            Mark all as read
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useInAppNotificationStore } from '../stores/inAppNotification.store';
import { storeToRefs } from 'pinia';

const store = useInAppNotificationStore();
const { notifications } = storeToRefs(store);

const currentTab = ref<'all' | 'unread'>('all');

const filteredNotifications = computed(() => {
    if (currentTab.value === 'unread') {
        return notifications.value.filter(n => !n.isRead);
    }
    return notifications.value;
});

const markAsRead = (id: string) => {
    store.markAsRead(id);
};
</script>

<style scoped>
.notifications-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    color: var(--color-text);
}

.header {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
}

.header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}

.back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text);
    padding: 0;
    display: flex;
}

.tabs {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--color-border);
}

.tabs button {
    background: none;
    border: none;
    padding: 0.5rem 0;
    font-size: 1rem;
    color: var(--color-text-dim);
    cursor: pointer;
    position: relative;
    font-weight: 500;
}

.tabs button.active {
    color: var(--color-text);
    font-weight: 700;
}

.tabs button.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--color-primary);
}

.notification-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.notification-item {
    padding: 1.5rem;
    border-radius: 8px;
    background-color: transparent;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--color-border);
}

.notification-item.unread {
    background-color: rgba(59, 130, 246, 0.05); /* Very light blue */
}

.notification-item:hover {
    background-color: var(--color-surface-hover);
}

.notification-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.notif-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text);
}

.notif-desc {
    font-size: 0.95rem;
    color: var(--color-text-dim);
    margin: 0;
}

.notif-time {
    font-size: 0.8rem;
    color: var(--color-text-light);
    margin-top: 0.5rem;
}

.empty-state {
    text-align: center;
    color: var(--color-text-dim);
    padding: 2rem;
}

.actions {
    margin-top: 2rem;
}

.mark-all-btn {
    background-color: #e2e8f0;
    color: #475569;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.mark-all-btn:hover {
    background-color: #cbd5e1;
}

@media (max-width: 768px) {
    .notifications-container {
        padding: 1rem;
    }
}
</style>
