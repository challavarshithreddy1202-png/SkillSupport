import { Router } from 'express';
import { getProfile, updateProfile, syncSkills } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/skills', syncSkills);

export default router;
