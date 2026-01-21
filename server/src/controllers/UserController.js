import { UserService } from '../services/UserService.js';

export class UserController {
  static async getAll(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error('[ERROR] Store users error:', err);
      res.status(500).json({ error: 'Server error fetching users' });
    }
  }
}
