import { queryAll, queryOne, run } from '../database/db.js';
import { generateSkillGapAnalysisWithAi, isAiConfigured } from '../services/aiService.js';

export function getLatestSkillGap(req, res) {
  try {
    const userId = req.user.id;
    const analysisRow = queryOne(`
      SELECT * FROM skill_gap_analyses
      WHERE user_id = ?
      ORDER BY id DESC LIMIT 1
    `, [userId]);

    if (!analysisRow) {
      return res.json({
        success: true,
        analysis: null,
        message: 'No skill gap analysis on record yet.'
      });
    }

    const analysis = {
      id: analysisRow.id,
      goal_id: analysisRow.goal_id,
      target_role: analysisRow.target_role,
      summary: analysisRow.summary,
      existing_skills_alignment: analysisRow.existing_skills_json ? JSON.parse(analysisRow.existing_skills_json) : [],
      skills_to_develop: analysisRow.skills_to_develop_json ? JSON.parse(analysisRow.skills_to_develop_json) : [],
      prerequisites: analysisRow.prerequisites_json ? JSON.parse(analysisRow.prerequisites_json) : [],
      recommended_priorities: analysisRow.priorities_json ? JSON.parse(analysisRow.priorities_json) : [],
      is_ai_generated: Boolean(analysisRow.is_ai_generated),
      created_at: analysisRow.created_at
    };

    return res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('[SkillGapController.getLatestSkillGap] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve skill-gap analysis.'
    });
  }
}

export async function generateSkillGap(req, res) {
  try {
    const userId = req.user.id;

    // If AI is configured, uses genuine Gemini. If not configured or times out, uses resilient domain diagnostic fallback.

    // Retrieve active goal, user branch, current profile, and user skills
    const user = queryOne('SELECT name, branch, year_of_study FROM users WHERE id = ?', [userId]);
    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]) || { available_hours_per_week: 8, learning_pace: 'Balanced' };
    const activeGoal = queryOne('SELECT * FROM goals WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [userId]);
    const skills = queryAll('SELECT name, category, proficiency FROM skills WHERE user_id = ?', [userId]);

    if (!activeGoal) {
      return res.status(400).json({
        success: false,
        error: 'NO_ACTIVE_GOAL',
        message: 'Please set a learning goal first before running skill-gap analysis.'
      });
    }

    // Call genuine AI service
    const aiAnalysis = await generateSkillGapAnalysisWithAi({
      goalTitle: activeGoal.title,
      goalCategory: activeGoal.category,
      currentSkills: skills,
      availableHours: profile.available_hours_per_week,
      learningPace: profile.learning_pace,
      branch: user.branch,
      experienceSummary: profile.experience_summary
    });

    // Save to database
    const insertRes = run(`
      INSERT INTO skill_gap_analyses (
        user_id, goal_id, target_role, summary,
        existing_skills_json, skills_to_develop_json, prerequisites_json, priorities_json, is_ai_generated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      userId,
      activeGoal.id,
      activeGoal.title,
      aiAnalysis.summary || 'AI diagnostic completed.',
      JSON.stringify(aiAnalysis.existing_skills_alignment || []),
      JSON.stringify(aiAnalysis.skills_to_develop || []),
      JSON.stringify(aiAnalysis.pace_feasibility_note ? [aiAnalysis.pace_feasibility_note] : []),
      JSON.stringify(aiAnalysis.recommended_priorities || [])
    ]);

    run(`
      INSERT INTO activity_logs (user_id, action_type, description)
      VALUES (?, 'SKILL_GAP_ANALYSIS', ?)
    `, [userId, `Generated AI Skill-Gap Analysis for goal "${activeGoal.title}"`]);

    const savedRow = queryOne('SELECT * FROM skill_gap_analyses WHERE id = ?', [insertRes.lastInsertRowid]);

    const formatted = {
      id: savedRow.id,
      goal_id: savedRow.goal_id,
      target_role: savedRow.target_role,
      summary: savedRow.summary,
      existing_skills_alignment: JSON.parse(savedRow.existing_skills_json || '[]'),
      skills_to_develop: JSON.parse(savedRow.skills_to_develop_json || '[]'),
      recommended_priorities: JSON.parse(savedRow.priorities_json || '[]'),
      is_ai_generated: true,
      created_at: savedRow.created_at
    };

    return res.status(201).json({
      success: true,
      message: 'AI Skill-Gap Analysis generated successfully.',
      analysis: formatted
    });
  } catch (err) {
    console.error('[SkillGapController.generateSkillGap] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'AI_GENERATION_FAILED',
      message: err.message || 'Could not complete AI skill-gap diagnosis. Please check network/API status and retry.'
    });
  }
}
