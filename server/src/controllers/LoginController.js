import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export class LoginController {
    static async login(req, res) {
        try {
            const { username } = req.body;

            if (!username || username.trim().length === 0) {
                return res.status(400).json({ error: 'Username is required' });
            }

            // Find or create user
            let user = await User.findOne({ username });
            let isNewUser = false;

            if (!user) {
                user = await User.create({ username });
                isNewUser = true;
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user._id, username: user.username },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                username: user.username,
                id: user._id,
                token: token,
                isNewUser: isNewUser
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
