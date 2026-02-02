import { Response } from 'express';
import { Notification } from '../models/Notification.js';

interface SSEClient {
    id: string;
    res: Response;
}

export class NotificationService {
    private static clients: SSEClient[] = [];

    static addClient(userId: string, res: Response) {
        this.clients.push({ id: userId, res });
        console.log(`[Notification] Client connected: ${userId}`);
    }

    static removeClient(userId: string, res: Response) {
        this.clients = this.clients.filter(client => client.res !== res);
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

            // 2. Send via SSE if connected
            const targets = this.clients.filter(client => client.id === userId);
            console.log(`[Notification] Sending to user ${userId}, found ${targets.length} connections`);

            if (targets.length > 0) {
                // Send standard event structure
                const event = {
                    type: 'NOTIFICATION',
                    payload: notification
                };
                const data = JSON.stringify(event);
                targets.forEach(client => {
                    client.res.write(`data: ${data}\n\n`);
                });
            }
        } catch (error) {
            console.error(`[Notification] Error saving/sending notification for ${userId}:`, error);
        }
    }

    static broadcast(event: { type: string, payload?: any }) {
        if (this.clients.length === 0) return;

        const data = JSON.stringify(event);
        console.log(`[Notification] Broadcasting event: ${event.type} to ${this.clients.length} clients`);

        this.clients.forEach(client => {
            try {
                client.res.write(`data: ${data}\n\n`);
            } catch (error) {
                console.error(`[Notification] Failed to send broadcast to client ${client.id}:`, error);
            }
        });
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
