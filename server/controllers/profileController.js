import { queryAll, queryOne, run, transaction } from '../database/db.js';

export function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const user = queryOne('SELECT id, name, email, branch, year_of_study, created_at FROM users WHERE id = ?', [userId]);
    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const skills = queryAll('SELECT id, name, category, proficiency FROM skills WHERE user_id = ? ORDER BY id ASC', [userId]);
    const activeGoal = queryOne('SELECT * FROM goals WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [userId]);

    return res.json({
      success: true,
      user,
      profile,
      skills,
      activeGoal
    });
  } catch (err) {
    console.error('[ProfileController.getProfile] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve profile.'
    });
  }
}

export function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      branch,
      year_of_study,
      available_hours_per_week,
      learning_pace,
      preferred_learning_style,
      experience_summary
    } = req.body;

    transaction(() => {
      // Update users table
      if (name || branch || year_of_study) {
        run(`
          UPDATE users
          SET name = COALESCE(?, name),
              branch = COALESCE(?, branch),
              year_of_study = COALESCE(?, year_of_study),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [name, branch, year_of_study, userId]);
      }

      // Update profiles table
      run(`
        UPDATE profiles
        SET available_hours_per_week = COALESCE(?, available_hours_per_week),
            learning_pace = COALESCE(?, learning_pace),
            preferred_learning_style = COALESCE(?, preferred_learning_style),
            experience_summary = COALESCE(?, experience_summary),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        available_hours_per_week !== undefined ? Number(available_hours_per_week) : null,
        learning_pace || null,
        preferred_learning_style || null,
        experience_summary !== undefined ? experience_summary : null,
        userId
      ]);

      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, 'PROFILE_UPDATED', 'Updated learning preferences and profile.')
      `, [userId]);
    });

    const updatedUser = queryOne('SELECT id, name, email, branch, year_of_study FROM users WHERE id = ?', [userId]);
    const updatedProfile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('[ProfileController.updateProfile] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update profile.'
    });
  }
}

export function syncSkills(req, res) {
  try {
    const userId = req.user.id;
    const { skills } = req.body; // Array of { name, category, proficiency }

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Skills must be an array of objects.'
      });
    }

    transaction(() => {
      // Clear existing skills for user
      run('DELETE FROM skills WHERE user_id = ?', [userId]);

      // Insert new skills
      const insertStmt = 'INSERT INTO skills (user_id, name, category, proficiency) VALUES (?, ?, ?, ?)';
      for (const s of skills) {
        if (s.name && s.name.trim()) {
          run(insertStmt, [
            userId,
            s.name.trim(),
            s.category || 'General',
            s.proficiency || 'Beginner'
          ]);
        }
      }

      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, 'SKILLS_UPDATED', ?)
      `, [userId, `Updated skills portfolio (${skills.length} skills listed).`]);
    });

    const updatedSkills = queryAll('SELECT id, name, category, proficiency FROM skills WHERE user_id = ? ORDER BY id ASC', [userId]);

    return res.json({
      success: true,
      message: 'Skills updated successfully.',
      skills: updatedSkills
    });
  } catch (err) {
    console.error('[ProfileController.syncSkills] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update skills.'
    });
  }
}
