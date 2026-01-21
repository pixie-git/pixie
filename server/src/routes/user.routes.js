import express from 'express';
import { UserController } from '../controllers/UserController.js';

const router = express.Router();

// Get all users
router.get('/', UserController.getAll);

export default router;