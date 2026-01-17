import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, 'username isAdmin'); // Select specific fields
        res.json(users);
    } catch (err) {
        console.error('[ERROR] Store users error:', err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

export default router;