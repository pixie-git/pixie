import { Response } from 'express';
import { Notification } from '../models/Notification.js';
import { getPubClient, getSubClient } from '../sockets/redisAdapter.js';

interface SSEClient {
    id: string;
    res: Response;
}

const localClients: SSEClient[] = [];

export class NotificationService {

    static init() {
        try {
            const subClient = getSubClient();
            subClient.subscribe('notifications', (message) => {
                try {
                    const parsed = JSON.parse(message);
                    const { action, event, userId } = parsed;
                    
                    const targets = action === 'sendToUser' && userId
                        ? localClients.filter(client => client.id === userId)
                        : localClients;

                    if (targets.length > 0) {
                        const data = JSON.stringify(event);
                        targets.forEach(client => {
                            try {
                                client.res.write(`data: ${data}\n\n`);
                            } catch (err) {
                                console.error(`[Notification] Failed to send to client ${client.id}:`, err);
                            }
                        });
                    }
                } catch (err) {
                    console.error('[Notification] Error parsing pub/sub message:', err);
                }
            });
            console.log('[Notification] Subscribed to Redis notifications channel');
        } catch (error) {
            console.error('[Notification] Failed to initialize Redis subscriber:', error);
        }
    }

    static addClient(userId: string, res: Response) {
        localClients.push({ id: userId, res });
        console.log(`[Notification] Client connected: ${userId}`);
    }

    static removeClient(userId: string, res: Response) {
        const index = localClients.findIndex(client => client.res === res);
        if (index !== -1) {
            localClients.splice(index, 1);
        }
        console.log(`[Notification] Client disconnected: ${userId}`);
    }

    static async sendToUser(userId: string, payload: { title: string; message: string }) {
        // 1. Save to Database
        try {
            const notification = await Notification.create({
                recipient: userId,
                title: payload.title,
                message: payload.message,
                isRead: false
            });

            // 2. Publish via Redis Pub/Sub
            const pubClient = getPubClient();
            const event = {
                type: 'NOTIFICATION',
                payload: notification
            };
            
            await pubClient.publish('notifications', JSON.stringify({
                action: 'sendToUser',
                userId,
                event
            }));
            console.log(`[Notification] Published sendToUser event for ${userId}`);
        } catch (error) {
            console.error(`[Notification] Error saving/publishing notification for ${userId}:`, error);
        }
    }

    static async broadcast(event: { type: string, payload?: any }) {
        try {
            const pubClient = getPubClient();
            await pubClient.publish('notifications', JSON.stringify({
                action: 'broadcast',
                event
            }));
            console.log(`[Notification] Published broadcast event: ${event.type}`);
        } catch (error) {
            console.error(`[Notification] Failed to publish broadcast event:`, error);
        }
    }

    static async getHistory(userId: string, limit: number = 50) {
        return Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    static async markAsRead(userId: string, notificationId: string) {
        console.log(`[Notification] MarkAsRead: User ${userId}, Notification ${notificationId}`);
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true },
            { new: true }
        );
        console.log(`[Notification] MarkAsRead Result:`, notification ? 'Success' : 'Not Found/Failed');
        return notification;
    }

    static async markAllAsRead(userId: string) {
        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
    }
}
