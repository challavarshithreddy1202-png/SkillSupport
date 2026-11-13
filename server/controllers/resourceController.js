import { queryAll } from '../database/db.js';

export function getResources(req, res) {
  try {
    const { search, type, skill } = req.query;

    let sql = `
      SELECT id, skill_name, title, url, type, source, is_verified, description
      FROM resources
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ` AND (title LIKE ? OR description LIKE ? OR skill_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (type && type !== 'All') {
      sql += ` AND type = ?`;
      params.push(type);
    }

    if (skill && skill !== 'All') {
      sql += ` AND skill_name = ?`;
      params.push(skill);
    }

    sql += ` ORDER BY is_verified DESC, id ASC LIMIT 50`;

    const resources = queryAll(sql, params).map(r => ({
      ...r,
      is_verified: Boolean(r.is_verified)
    }));

    // Get list of unique available categories and skills for filtering
    const skillsList = queryAll(`
      SELECT DISTINCT skill_name FROM resources WHERE skill_name IS NOT NULL AND skill_name != ''
    `).map(r => r.skill_name);

    return res.json({
      success: true,
      resources,
      availableSkills: skillsList
    });
  } catch (err) {
    console.error('[ResourceController.getResources] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve resources.'
    });
  }
}
