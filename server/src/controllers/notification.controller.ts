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
            res.write(': connected\n\n');

            NotificationService.addClient(user.id, res);

            // Clean up on client disconnect
            req.on('close', () => {
                NotificationService.removeClient(user.id, res);
            });

        } catch (error) {
            next(error);
        }
    }
}
