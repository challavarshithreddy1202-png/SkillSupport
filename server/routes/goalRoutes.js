import { Router } from 'express';
import { getGoals, createGoal } from '../controllers/goalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getGoals);
router.post('/', createGoal);

export default router;
