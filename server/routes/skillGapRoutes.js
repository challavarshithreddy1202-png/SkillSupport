import { Router } from 'express';
import { getLatestSkillGap, generateSkillGap } from '../controllers/skillGapController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getLatestSkillGap);
router.post('/generate', generateSkillGap);

export default router;
