import { Router } from 'express';
import { LobbyController } from '../controllers/lobby.controller';

const router = Router();

// Crea una nuova stanza
router.post('/', LobbyController.create);

// Ottieni lista stanze
router.get('/', LobbyController.getAll);

export default router;