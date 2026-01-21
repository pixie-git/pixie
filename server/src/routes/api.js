import express from 'express';
import { LoginController } from '../controllers/LoginController.js';

const router = express.Router();

import userRoutes from './user.routes.js';

router.post('/login', LoginController.login);
router.use('/users', userRoutes);

export default router;
