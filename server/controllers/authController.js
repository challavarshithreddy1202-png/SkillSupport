import bcrypt from 'bcryptjs';
import { queryOne, run, transaction } from '../database/db.js';
import { generateToken } from '../middleware/authMiddleware.js';

export function register(req, res) {
  try {
    const { name, email, password, branch, year_of_study } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'An account with this email address already exists.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const userResult = transaction(() => {
      const uRes = run(`
        INSERT INTO users (name, email, password_hash, branch, year_of_study)
        VALUES (?, ?, ?, ?, ?)
      `, [name.trim(), trimmedEmail, passwordHash, branch || 'Computer Science & Engineering', year_of_study || '3rd Year']);

      const userId = uRes.lastInsertRowid;

      // Create default profile
      run(`
        INSERT INTO profiles (user_id, available_hours_per_week, learning_pace, preferred_learning_style)
        VALUES (?, ?, ?, ?)
      `, [userId, 8, 'Balanced', 'Hands-on Projects & Docs']);

      // Log registration activity
      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, 'USER_REGISTERED', 'Created SkillSupport student account.')
      `, [userId]);

      return { userId };
    });

    const user = queryOne('SELECT id, name, email, branch, year_of_study, created_at FROM users WHERE id = ?', [userResult.userId]);
    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [userResult.userId]);
    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user,
      profile
    });
  } catch (err) {
    console.error('[AuthController.register] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to create account. Please try again.'
    });
  }
}

export function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Please provide both email and password.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = queryOne('SELECT * FROM users WHERE email = ?', [trimmedEmail]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    // Fetch profile and active goal
    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [user.id]);
    const activeGoal = queryOne('SELECT * FROM goals WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [user.id]);

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    return res.json({
      success: true,
      message: 'Welcome back!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year_of_study: user.year_of_study,
        created_at: user.created_at
      },
      profile,
      activeGoal
    });
  } catch (err) {
    console.error('[AuthController.login] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to log in. Please try again.'
    });
  }
}

export function getMe(req, res) {
  try {
    const user = req.user;
    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [user.id]);
    const activeGoal = queryOne('SELECT * FROM goals WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [user.id]);
    const skills = queryOne('SELECT * FROM skills WHERE user_id = ?', [user.id]) || [];

    return res.json({
      success: true,
      user,
      profile,
      activeGoal
    });
  } catch (err) {
    console.error('[AuthController.getMe] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch user session.'
    });
  }
}
