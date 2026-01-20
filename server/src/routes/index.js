import express from 'express';
import apiRoutes from './api.js';

const router = express.Router();

router.use('/', apiRoutes);

export default router;

