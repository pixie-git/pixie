import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {

    static async stream(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;

            // Headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Nginx buffering workaround

            // Send initial comment to keep connection open
            console.log(`[Notification] SSE Client attempting connection: ${user.id}`);
            res.write(': connected\n\n');

            // Heartbeat to prevent timeouts
            const keepAlive = setInterval(() => {
                res.write(': keep-alive\n\n');
            }, 30000);

            NotificationService.addClient(user.id, res);

            // Clean up on client disconnect
            req.on('close', () => {
                console.log(`[Notification] SSE Client closed connection: ${user.id}`);
                clearInterval(keepAlive);
                NotificationService.removeClient(user.id, res);
            });

        } catch (error) {
            next(error);
        }
    }

    static async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const history = await NotificationService.getHistory(user.id);
            res.json(history);
        } catch (error) {
            next(error);
        }
    }

    static async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            const notificationId = req.params.id;
            await NotificationService.markAsRead(user.id, notificationId);
            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            await NotificationService.markAllAsRead(user.id);
            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    }
}
