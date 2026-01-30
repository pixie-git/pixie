import { Response } from 'express';

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

    static sendToUser(userId: string, payload: any) {
        const targets = this.clients.filter(client => client.id === userId);
        console.log(`[Notification] Sending to user ${userId}, found ${targets.length} connections`);

        if (targets.length === 0) return;

        const data = JSON.stringify(payload);
        targets.forEach(client => {
            client.res.write(`data: ${data}\n\n`);
        });
    }
}
