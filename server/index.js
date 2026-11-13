import dotenv from 'dotenv';
import app from './app.js';
import { initDatabase } from './database/db.js';
import { isAiConfigured } from './services/aiService.js';

dotenv.config();

let PORT = parseInt(process.env.PORT, 10) || 5001;

try {
  // Initialize SQLite database tables and seed verified resources
  initDatabase();
  console.log('[SkillSupport] Database initialized successfully.');

  const aiReady = isAiConfigured();
  if (aiReady) {
    console.log(`[SkillSupport] Gemini AI service configured with model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
  } else {
    console.log('[SkillSupport] Notice: GEMINI_API_KEY is not set in server/.env. Non-AI features will work normally, and a friendly setup alert is shown for AI roadmap generation.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[SkillSupport Backend] Server listening at http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[SkillSupport Backend] Port ${PORT} is in use. Attempting port ${PORT + 1}...`);
      server.listen(PORT + 1, () => {
        console.log(`[SkillSupport Backend] Server listening at http://localhost:${PORT + 1}`);
      });
    } else {
      console.error('[SkillSupport Backend] Server error:', err);
    }
  });
} catch (err) {
  console.error('[SkillSupport Backend] Initialization failed:', err);
  process.exit(1);
}
