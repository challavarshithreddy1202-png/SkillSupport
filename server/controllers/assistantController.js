import { queryAll, queryOne, run } from '../database/db.js';
import { chatWithAssistantWithAi, isAiConfigured } from '../services/aiService.js';

export function getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = queryAll(`
      SELECT id, role, content, context_topic, created_at
      FROM ai_conversations
      WHERE user_id = ?
      ORDER BY id ASC LIMIT 50
    `, [userId]);

    return res.json({
      success: true,
      history
    });
  } catch (err) {
    console.error('[AssistantController.getChatHistory] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve conversation history.'
    });
  }
}

export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const { message, context_topic } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Message cannot be empty.'
      });
    }

    if (!isAiConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'AI_NOT_CONFIGURED',
        message: 'Google Gemini API key is not configured. Please add GEMINI_API_KEY in server/.env to chat with the AI Learning Assistant.'
      });
    }

    // Load Student Context
    const user = queryOne('SELECT name, branch FROM users WHERE id = ?', [userId]);
    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]) || {};
    const activeGoal = queryOne('SELECT title FROM goals WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [userId]);

    // Current roadmap & milestone context
    const currentRoadmap = queryOne(`SELECT id, title FROM roadmaps WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`, [userId]);
    let currentMilestoneTitle = '';
    let currentTaskTitle = '';

    if (currentRoadmap) {
      const activeMilestone = queryOne(`
        SELECT title FROM milestones
        WHERE roadmap_id = ? AND status != 'completed'
        ORDER BY order_index ASC LIMIT 1
      `, [currentRoadmap.id]);
      currentMilestoneTitle = activeMilestone?.title || '';

      const nextTask = queryOne(`
        SELECT title FROM tasks
        WHERE roadmap_id = ? AND is_completed = 0
        ORDER BY order_index ASC LIMIT 1
      `, [currentRoadmap.id]);
      currentTaskTitle = nextTask?.title || '';
    }

    // Retrieve previous conversation messages
    const pastMessages = queryAll(`
      SELECT role, content FROM ai_conversations
      WHERE user_id = ?
      ORDER BY id DESC LIMIT 10
    `, [userId]).reverse();

    // Call Gemini AI
    const reply = await chatWithAssistantWithAi({
      userMessage: message.trim(),
      conversationHistory: pastMessages,
      studentContext: {
        name: user.name,
        branch: user.branch,
        goalTitle: activeGoal?.title,
        currentMilestone: currentMilestoneTitle,
        currentTask: currentTaskTitle,
        weeklyHours: profile.available_hours_per_week || 8,
        learningPace: profile.learning_pace || 'Balanced'
      }
    });

    // Save user message and AI response
    run(`
      INSERT INTO ai_conversations (user_id, role, content, context_topic)
      VALUES (?, 'user', ?, ?)
    `, [userId, message.trim(), context_topic || 'General Learning']);

    const assistantMsg = run(`
      INSERT INTO ai_conversations (user_id, role, content, context_topic)
      VALUES (?, 'assistant', ?, ?)
    `, [userId, reply, context_topic || 'General Learning']);

    return res.json({
      success: true,
      message: {
        id: assistantMsg.lastInsertRowid,
        role: 'assistant',
        content: reply,
        context_topic: context_topic || 'General Learning',
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[AssistantController.sendMessage] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'AI_CHAT_FAILED',
      message: err.message || 'The AI assistant was unable to respond. Please check your network or API quota and retry.'
    });
  }
}

export function clearChatHistory(req, res) {
  try {
    const userId = req.user.id;
    run('DELETE FROM ai_conversations WHERE user_id = ?', [userId]);

    return res.json({
      success: true,
      message: 'Chat history cleared.'
    });
  } catch (err) {
    console.error('[AssistantController.clearChatHistory] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to clear chat history.'
    });
  }
}
