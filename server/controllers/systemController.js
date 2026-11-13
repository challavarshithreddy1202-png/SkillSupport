import { isAiConfigured } from '../services/aiService.js';
import { queryOne } from '../database/db.js';

export function getSystemStatus(req, res) {
  try {
    const configured = isAiConfigured();
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    // Verify DB connectivity
    let dbStatus = false;
    try {
      const test = queryOne('SELECT 1 as ok');
      dbStatus = test && test.ok === 1;
    } catch {
      dbStatus = false;
    }

    return res.json({
      success: true,
      aiConfigured: configured,
      aiModel: model,
      databaseReady: dbStatus,
      systemName: 'SkillSupport',
      officialTitle: 'AI-Assisted Personalized Skill Development and Learning Roadmap System',
      tagline: 'Plan. Learn. Grow.',
      setupHelp: configured ? null : {
        instruction: 'To enable genuine AI-assisted roadmaps and skill analysis, provide your Google Gemini API key in the server/.env file as GEMINI_API_KEY=your_key.',
        docUrl: 'https://aistudio.google.com/app/apikey'
      }
    });
  } catch (err) {
    console.error('[SystemController.getSystemStatus] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'System health check failed.'
    });
  }
}
