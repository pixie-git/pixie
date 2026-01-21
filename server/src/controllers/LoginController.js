import { UserService } from '../services/UserService.js';

export class LoginController {
    static async login(req, res) {
        try {
            const { username } = req.body;

            // Validation (Controller responsibility)
            if (!username || username.trim().length === 0) {
                return res.status(400).json({ error: 'Username is required' });
            }

            // Call Service (Manager)
            const result = await UserService.login(username);

            // Send Response (Controller responsibility)
            return res.status(200).json(result);
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
