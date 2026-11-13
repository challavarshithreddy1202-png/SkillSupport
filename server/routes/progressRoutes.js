import { Router } from 'express';
import { getProgress } from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getProgress);

export default router;
