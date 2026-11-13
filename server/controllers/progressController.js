import { queryAll, queryOne } from '../database/db.js';

export function getProgress(req, res) {
  try {
    const userId = req.user.id;

    // Get active roadmap
    const roadmap = queryOne(`
      SELECT * FROM roadmaps
      WHERE user_id = ? AND status = 'active'
      ORDER BY id DESC LIMIT 1
    `, [userId]);

    if (!roadmap) {
      return res.json({
        success: true,
        hasRoadmap: false,
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          completionPercentage: 0,
          totalMilestones: 0,
          completedMilestones: 0,
          totalHours: 0,
          completedHours: 0
        },
        milestoneProgress: [],
        recentActivities: []
      });
    }

    // Milestones breakdown
    const milestones = queryAll(`
      SELECT m.id, m.title, m.order_index, m.estimated_weeks, m.status,
             COUNT(t.id) as task_count,
             SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed_task_count,
             SUM(t.estimated_hours) as total_hours,
             SUM(CASE WHEN t.is_completed = 1 THEN t.estimated_hours ELSE 0 END) as completed_hours
      FROM milestones m
      LEFT JOIN tasks t ON m.id = t.milestone_id
      WHERE m.roadmap_id = ?
      GROUP BY m.id
      ORDER BY m.order_index ASC
    `, [roadmap.id]);

    let totalTasks = 0;
    let completedTasks = 0;
    let totalMilestones = milestones.length;
    let completedMilestones = 0;
    let totalEstimatedHours = 0;
    let completedEstimatedHours = 0;

    const milestoneProgress = milestones.map(m => {
      const tCount = m.task_count || 0;
      const cCount = m.completed_task_count || 0;
      const tHours = Number(m.total_hours || 0);
      const cHours = Number(m.completed_hours || 0);

      totalTasks += tCount;
      completedTasks += cCount;
      totalEstimatedHours += tHours;
      completedEstimatedHours += cHours;

      if (tCount > 0 && cCount === tCount) {
        completedMilestones++;
      }

      const percent = tCount > 0 ? Math.round((cCount / tCount) * 100) : 0;

      return {
        id: m.id,
        title: m.title,
        order: m.order_index,
        taskCount: tCount,
        completedCount: cCount,
        totalHours: Math.round(tHours * 10) / 10,
        completedHours: Math.round(cHours * 10) / 10,
        completionPercentage: percent,
        status: percent === 100 ? 'Completed' : percent > 0 ? 'In Progress' : 'Pending'
      };
    });

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Recent user activities
    const recentActivities = queryAll(`
      SELECT id, action_type, description, created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY id DESC LIMIT 15
    `, [userId]);

    return res.json({
      success: true,
      hasRoadmap: true,
      summary: {
        roadmapTitle: roadmap.title,
        totalTasks,
        completedTasks,
        completionPercentage,
        totalMilestones,
        completedMilestones,
        totalHours: Math.round(totalEstimatedHours * 10) / 10,
        completedHours: Math.round(completedEstimatedHours * 10) / 10,
        weeklyTargetHours: roadmap.weekly_hours || 8,
        totalWeeks: roadmap.total_weeks || 12
      },
      milestoneProgress,
      recentActivities
    });
  } catch (err) {
    console.error('[ProgressController.getProgress] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to calculate learning progress.'
    });
  }
}
