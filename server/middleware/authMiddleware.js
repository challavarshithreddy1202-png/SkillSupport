import jwt from 'jsonwebtoken';
import { queryOne } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillsupport_college_project_jwt_secret_key_2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_REQUIRED',
      message: 'Access denied. No authorization token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verify user still exists in database
    const user = queryOne('SELECT id, name, email, branch, year_of_study FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'The account associated with this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired session. Please log in again.'
    });
  }
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
