import { Router } from 'express';
import { getChatHistory, sendMessage, clearChatHistory } from '../controllers/assistantController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/history', getChatHistory);
router.post('/chat', sendMessage);
router.delete('/history', clearChatHistory);

export default router;
