import { queryAll, queryOne, run, transaction } from '../database/db.js';
import { analyzeGoalWithAi, isAiConfigured } from '../services/aiService.js';

export function getGoals(req, res) {
  try {
    const userId = req.user.id;
    const goals = queryAll('SELECT * FROM goals WHERE user_id = ? ORDER BY is_active DESC, id DESC', [userId]);
    return res.json({
      success: true,
      goals
    });
  } catch (err) {
    console.error('[GoalController.getGoals] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve goals.'
    });
  }
}

export async function createGoal(req, res) {
  try {
    const userId = req.user.id;
    const { title, description, category, target_timeline_weeks, analyze_with_ai } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Goal title is required.'
      });
    }

    let interpretedGoal = null;
    let finalTitle = title.trim();
    let finalCategory = category || 'Engineering Specialization';
    let finalTimeline = target_timeline_weeks ? Number(target_timeline_weeks) : 12;

    // Optional AI goal analysis if requested and AI is configured
    if (analyze_with_ai && isAiConfigured()) {
      try {
        const user = queryOne('SELECT branch FROM users WHERE id = ?', [userId]);
        interpretedGoal = await analyzeGoalWithAi(finalTitle, user?.branch || 'Engineering');
        if (interpretedGoal.interpreted_title) {
          finalTitle = interpretedGoal.interpreted_title;
        }
        if (interpretedGoal.category) {
          finalCategory = interpretedGoal.category;
        }
        if (interpretedGoal.estimated_weeks) {
          finalTimeline = interpretedGoal.estimated_weeks;
        }
      } catch (aiErr) {
        console.warn('[GoalController.createGoal] AI Goal Analysis warning:', aiErr.message);
        // Continue without blocking creation if AI analysis had an issue
      }
    }

    const goalId = transaction(() => {
      // Set existing goals to inactive if user sets a new primary goal
      run('UPDATE goals SET is_active = 0 WHERE user_id = ?', [userId]);

      const gRes = run(`
        INSERT INTO goals (user_id, title, description, category, target_timeline_weeks, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [userId, finalTitle, description || (interpretedGoal?.clarification_summary || ''), finalCategory, finalTimeline]);

      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, 'GOAL_CREATED', ?)
      `, [userId, `Set new learning goal: "${finalTitle}"`]);

      return gRes.lastInsertRowid;
    });

    const createdGoal = queryOne('SELECT * FROM goals WHERE id = ?', [goalId]);

    return res.status(201).json({
      success: true,
      message: 'Learning goal established.',
      goal: createdGoal,
      aiAnalysis: interpretedGoal
    });
  } catch (err) {
    console.error('[GoalController.createGoal] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to create goal.'
    });
  }
}
