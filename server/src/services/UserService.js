import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export class UserService {
  /**
   * Handle user login/registration and token generation
   * @param {string} username 
   * @returns {Promise<Object>} User data, token, and isNewUser flag
   */
  static async login(username) {
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

    return {
      username: user.username,
      id: user._id,
      token: token,
      isNewUser: isNewUser
    };
  }

  /**
   * Retrieve all users with limited fields
   * @returns {Promise<Array>} List of users
   */
  static async getAllUsers() {
    return await User.find({}, 'username isAdmin');
  }
}
