import { Router } from 'express';
import {
  getCurrentRoadmap,
  getRoadmapHistory,
  getRoadmapById,
  generateRoadmap,
  startNewRoadmap,
  updateTaskStatus,
  previewRoadmapRefinement,
  applyRoadmapRefinement
} from '../controllers/roadmapController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getCurrentRoadmap);
router.get('/history', getRoadmapHistory);
router.get('/:roadmapId', getRoadmapById);
router.post('/generate', generateRoadmap);
router.post('/start-new', startNewRoadmap);
router.patch('/tasks/:taskId/status', updateTaskStatus);
router.post('/:roadmapId/refine-preview', previewRoadmapRefinement);
router.post('/:roadmapId/refine-apply', applyRoadmapRefinement);

export default router;
