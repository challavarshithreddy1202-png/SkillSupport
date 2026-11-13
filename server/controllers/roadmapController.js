import { queryAll, queryOne, run, transaction } from '../database/db.js';
import { generateRoadmapWithAi, refineRoadmapWithAi, isAiConfigured } from '../services/aiService.js';
import { findMatchingResources } from '../database/seedResources.js';

/**
 * Helper to hydrate a full roadmap object with milestones, tasks, and resources
 */
export function getHydratedRoadmap(roadmapId) {
  const roadmap = queryOne('SELECT * FROM roadmaps WHERE id = ?', [roadmapId]);
  if (!roadmap) return null;

  const milestones = queryAll(`
    SELECT * FROM milestones
    WHERE roadmap_id = ?
    ORDER BY order_index ASC
  `, [roadmapId]);

  let totalTasksCount = 0;
  let completedTasksCount = 0;

  for (const m of milestones) {
    const tasks = queryAll(`
      SELECT * FROM tasks
      WHERE milestone_id = ?
      ORDER BY order_index ASC
    `, [m.id]);

    for (const t of tasks) {
      t.is_completed = Boolean(t.is_completed);
      if (t.is_completed) completedTasksCount++;
      totalTasksCount++;

      // Fetch task resources
      t.resources = queryAll(`
        SELECT id, title, url, type, source, is_verified, description
        FROM resources
        WHERE task_id = ?
      `, [t.id]);
    }

    m.tasks = tasks;
    m.is_completed = tasks.length > 0 && tasks.every(t => t.is_completed);
    m.completed_count = tasks.filter(t => t.is_completed).length;
    m.total_count = tasks.length;
  }

  roadmap.milestones = milestones;
  roadmap.total_tasks = totalTasksCount;
  roadmap.completed_tasks = completedTasksCount;
  roadmap.completion_percentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return roadmap;
}

export function getCurrentRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const roadmapRow = queryOne(`
      SELECT id FROM roadmaps
      WHERE user_id = ? AND status IN ('active', 'completed')
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id DESC LIMIT 1
    `, [userId]);

    if (!roadmapRow) {
      return res.json({
        success: true,
        roadmap: null,
        message: 'No active roadmap found. Generate one to start learning!'
      });
    }

    const fullRoadmap = getHydratedRoadmap(roadmapRow.id);

    return res.json({
      success: true,
      roadmap: fullRoadmap
    });
  } catch (err) {
    console.error('[RoadmapController.getCurrentRoadmap] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve roadmap.'
    });
  }
}

export function getRoadmapHistory(req, res) {
  try {
    const userId = req.user.id;
    const roadmaps = queryAll(`
      SELECT r.id, r.title, r.summary, r.status, r.total_weeks, r.weekly_hours,
             r.total_tasks, r.completed_tasks, r.created_at, r.updated_at,
             g.title as goal_title
      FROM roadmaps r
      LEFT JOIN goals g ON r.goal_id = g.id
      WHERE r.user_id = ?
      ORDER BY r.id DESC
    `, [userId]).map(r => ({
      ...r,
      completion_percentage: r.total_tasks > 0 ? Math.round((r.completed_tasks / r.total_tasks) * 100) : 0,
      is_completed: r.total_tasks > 0 && r.completed_tasks === r.total_tasks
    }));

    return res.json({
      success: true,
      roadmaps
    });
  } catch (err) {
    console.error('[RoadmapController.getRoadmapHistory] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve roadmap history.'
    });
  }
}

export function getRoadmapById(req, res) {
  try {
    const userId = req.user.id;
    const { roadmapId } = req.params;

    const roadmapRow = queryOne('SELECT id FROM roadmaps WHERE id = ? AND user_id = ?', [roadmapId, userId]);
    if (!roadmapRow) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Roadmap not found.'
      });
    }

    const fullRoadmap = getHydratedRoadmap(roadmapRow.id);

    return res.json({
      success: true,
      roadmap: fullRoadmap
    });
  } catch (err) {
    console.error('[RoadmapController.getRoadmapById] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve roadmap.'
    });
  }
}

export async function startNewRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const { goalTitle, goalDescription, goalCategory, availableHours, learningPace, skills } = req.body;

    if (!goalTitle || !goalTitle.trim()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Please provide a title for your new learning goal.'
      });
    }

    const user = queryOne('SELECT name, branch, year_of_study FROM users WHERE id = ?', [userId]);
    const weeklyHours = availableHours ? Number(availableHours) : 8;
    const pace = learningPace || 'Balanced';

    // 1. Create or update profile preferences
    run(`
      INSERT INTO profiles (user_id, available_hours_per_week, learning_pace, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        available_hours_per_week = excluded.available_hours_per_week,
        learning_pace = excluded.learning_pace,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, weeklyHours, pace]);

    // 2. Mark existing active goals as inactive, insert new goal
    run('UPDATE goals SET is_active = 0 WHERE user_id = ?', [userId]);
    const goalRes = run(`
      INSERT INTO goals (user_id, title, description, category, target_completion_weeks, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [userId, goalTitle.trim(), goalDescription?.trim() || '', goalCategory || 'Engineering Development', 12]);
    const goalId = goalRes.lastInsertRowid;

    // 3. Sync skills if provided
    if (Array.isArray(skills) && skills.length > 0) {
      for (const s of skills) {
        if (s.name && s.name.trim()) {
          run(`
            INSERT INTO skills (user_id, name, category, proficiency)
            VALUES (?, ?, ?, ?)
          `, [userId, s.name.trim(), s.category || 'Technical', s.proficiency || 'Beginner']);
        }
      }
    }

    const currentSkills = queryAll('SELECT name, category, proficiency FROM skills WHERE user_id = ?', [userId]);

    // 4. Generate the new roadmap using AI (with guaranteed fallback)
    const aiRoadmap = await generateRoadmapWithAi({
      goalTitle: goalTitle.trim(),
      goalCategory: goalCategory || 'Engineering Development',
      currentSkills,
      availableHours: weeklyHours,
      learningPace: pace,
      branch: user?.branch || 'Engineering'
    });

    // 5. Save new roadmap in SQLite
    const newRoadmapId = transaction(() => {
      // Mark old active roadmaps as completed if 100%, or archived
      run(`
        UPDATE roadmaps
        SET status = CASE WHEN completed_tasks >= total_tasks AND total_tasks > 0 THEN 'completed' ELSE 'archived' END
        WHERE user_id = ? AND status = 'active'
      `, [userId]);

      const rRes = run(`
        INSERT INTO roadmaps (
          user_id, goal_id, title, summary, target_pace, weekly_hours, total_weeks, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `, [
        userId,
        goalId,
        aiRoadmap.title || `Learning Roadmap for ${goalTitle.trim()}`,
        aiRoadmap.summary || '',
        pace,
        weeklyHours,
        aiRoadmap.total_weeks || 12
      ]);

      const roadmapId = rRes.lastInsertRowid;
      let totalTasks = 0;

      for (let mIdx = 0; mIdx < aiRoadmap.milestones.length; mIdx++) {
        const m = aiRoadmap.milestones[mIdx];
        const mRes = run(`
          INSERT INTO milestones (
            roadmap_id, order_index, title, description, estimated_weeks, prerequisites, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'not_started')
        `, [
          roadmapId,
          m.order_index || (mIdx + 1),
          m.title,
          m.description || '',
          m.estimated_weeks || 2,
          m.prerequisites || ''
        ]);

        const milestoneId = mRes.lastInsertRowid;

        if (Array.isArray(m.tasks)) {
          for (let tIdx = 0; tIdx < m.tasks.length; tIdx++) {
            const t = m.tasks[tIdx];
            totalTasks++;

            const tRes = run(`
              INSERT INTO tasks (
                milestone_id, roadmap_id, order_index, title, description,
                estimated_hours, completion_criteria, practice_exercises, mini_project, is_completed
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `, [
              milestoneId,
              roadmapId,
              t.order_index || (tIdx + 1),
              t.title,
              t.description || '',
              t.estimated_hours || 2.0,
              t.completion_criteria || '',
              t.practice_exercises || '',
              t.mini_project || ''
            ]);

            const taskId = tRes.lastInsertRowid;

            let resourcesToInsert = Array.isArray(t.recommended_resources) ? [...t.recommended_resources] : [];
            if (resourcesToInsert.length < 2) {
              const matched = findMatchingResources(t.title, t.description, goalTitle, 3 - resourcesToInsert.length);
              for (const mRes of matched) {
                if (!resourcesToInsert.some(r => r.url === mRes.url || r.title === mRes.title)) {
                  resourcesToInsert.push(mRes);
                }
              }
            }

            for (const r of resourcesToInsert) {
              if (r.title && r.url) {
                run(`
                  INSERT INTO resources (
                    task_id, skill_name, title, url, type, source, is_verified, description
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  taskId,
                  t.title,
                  r.title,
                  r.url,
                  r.type || 'Documentation',
                  r.source || 'Curated',
                  r.is_verified ? 1 : 0,
                  r.description || ''
                ]);
              }
            }
          }
        }
      }

      run('UPDATE roadmaps SET total_tasks = ? WHERE id = ?', [totalTasks, roadmapId]);

      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, 'ROADMAP_STARTED', ?)
      `, [userId, `Started new learning roadmap for "${goalTitle.trim()}" with ${totalTasks} tasks.`]);

      return roadmapId;
    });

    const fullRoadmap = getHydratedRoadmap(newRoadmapId);

    // Trigger skill-gap in the background for this new goal
    generateSkillGapAnalysisWithAi({
      goalTitle: goalTitle.trim(),
      goalCategory: goalCategory || 'Engineering Development',
      currentSkills,
      availableHours: weeklyHours,
      learningPace: pace,
      branch: user?.branch || 'Engineering'
    }).then(gap => {
      run(`
        INSERT INTO skill_gap_analyses (
          user_id, goal_id, target_role, summary,
          existing_skills_json, skills_to_develop_json,
          prerequisites_json, priorities_json, is_ai_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        userId,
        goalId,
        goalTitle.trim(),
        gap.summary || '',
        JSON.stringify(gap.existing_skills_alignment || []),
        JSON.stringify(gap.skills_to_develop || []),
        JSON.stringify([]),
        JSON.stringify(gap.recommended_priorities || [])
      ]);
    }).catch(err => console.warn('[RoadmapController] Background skill gap error:', err.message));

    return res.status(201).json({
      success: true,
      message: 'New learning roadmap generated successfully!',
      roadmap: fullRoadmap
    });
  } catch (err) {
    console.error('[RoadmapController.startNewRoadmap] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to start new roadmap.'
    });
  }
}

export async function generateRoadmap(req, res) {
  try {
    const userId = req.user.id;

    // If AI is configured, generateRoadmapWithAi uses genuine Gemini API.
    // If AI is not configured or fails, it seamlessly falls back to our rich domain curriculum generator so roadmap generation never fails!

    const user = queryOne('SELECT name, branch, year_of_study FROM users WHERE id = ?', [userId]);
    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]) || { available_hours_per_week: 8, learning_pace: 'Balanced' };
    const activeGoal = queryOne('SELECT * FROM goals WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [userId]);
    const skills = queryAll('SELECT name, category, proficiency FROM skills WHERE user_id = ?', [userId]);
    const latestGap = queryOne('SELECT summary FROM skill_gap_analyses WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);

    if (!activeGoal) {
      return res.status(400).json({
        success: false,
        error: 'NO_ACTIVE_GOAL',
        message: 'Please set your learning goal first before generating a roadmap.'
      });
    }

    // Call Genuine AI Service
    const aiRoadmap = await generateRoadmapWithAi({
      goalTitle: activeGoal.title,
      goalCategory: activeGoal.category,
      currentSkills: skills,
      availableHours: profile.available_hours_per_week,
      learningPace: profile.learning_pace,
      branch: user.branch,
      skillGapSummary: latestGap?.summary
    });

    // Save generated roadmap in SQLite within transaction
    const newRoadmapId = transaction(() => {
      // Archive existing active roadmaps
      run("UPDATE roadmaps SET status = 'archived' WHERE user_id = ? AND status = 'active'", [userId]);

      const rRes = run(`
        INSERT INTO roadmaps (
          user_id, goal_id, title, summary, target_pace, weekly_hours, total_weeks, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `, [
        userId,
        activeGoal.id,
        aiRoadmap.title || `Learning Roadmap for ${activeGoal.title}`,
        aiRoadmap.summary || '',
        profile.learning_pace,
        profile.available_hours_per_week,
        aiRoadmap.total_weeks || 12
      ]);

      const roadmapId = rRes.lastInsertRowid;
      let totalTasks = 0;

      for (let mIdx = 0; mIdx < aiRoadmap.milestones.length; mIdx++) {
        const m = aiRoadmap.milestones[mIdx];
        const mRes = run(`
          INSERT INTO milestones (
            roadmap_id, order_index, title, description, estimated_weeks, prerequisites, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'not_started')
        `, [
          roadmapId,
          m.order_index || (mIdx + 1),
          m.title,
          m.description || '',
          m.estimated_weeks || 2,
          m.prerequisites || ''
        ]);

        const milestoneId = mRes.lastInsertRowid;

        if (Array.isArray(m.tasks)) {
          for (let tIdx = 0; tIdx < m.tasks.length; tIdx++) {
            const t = m.tasks[tIdx];
            totalTasks++;

            const tRes = run(`
              INSERT INTO tasks (
                milestone_id, roadmap_id, order_index, title, description,
                estimated_hours, completion_criteria, practice_exercises, mini_project, is_completed
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `, [
              milestoneId,
              roadmapId,
              t.order_index || (tIdx + 1),
              t.title,
              t.description || '',
              t.estimated_hours || 2.0,
              t.completion_criteria || '',
              t.practice_exercises || '',
              t.mini_project || ''
            ]);

            const taskId = tRes.lastInsertRowid;

            // Insert recommended resources for this task (with intelligent matching fallback)
            let resourcesToInsert = Array.isArray(t.recommended_resources) ? [...t.recommended_resources] : [];
            if (resourcesToInsert.length < 2) {
              const matched = findMatchingResources(t.title, t.description, activeGoal.title, 3 - resourcesToInsert.length);
              for (const mRes of matched) {
                if (!resourcesToInsert.some(r => r.url === mRes.url || r.title === mRes.title)) {
                  resourcesToInsert.push(mRes);
                }
              }
            }

            for (const r of resourcesToInsert) {
              if (r.title && r.url) {
                run(`
                  INSERT INTO resources (
                    task_id, skill_name, title, url, type, source, is_verified, description
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  taskId,
                  t.title,
                  r.title,
                  r.url,
                  r.type || 'Documentation',
                  r.source || 'Curated',
                  r.is_verified ? 1 : 0,
                  r.description || ''
                ]);
              }
            }
          }
        }
      }

      run('UPDATE roadmaps SET total_tasks = ? WHERE id = ?', [totalTasks, roadmapId]);

      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, 'ROADMAP_GENERATED', ?)
      `, [userId, `Generated AI personalized learning roadmap with ${totalTasks} tasks.`]);

      return roadmapId;
    });

    const fullRoadmap = getHydratedRoadmap(newRoadmapId);

    return res.status(201).json({
      success: true,
      message: 'AI Personalized Learning Roadmap created.',
      roadmap: fullRoadmap
    });
  } catch (err) {
    console.error('[RoadmapController.generateRoadmap] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'AI_ROADMAP_GENERATION_FAILED',
      message: err.message || 'Could not generate roadmap. Please verify AI configuration and retry.'
    });
  }
}

export function updateTaskStatus(req, res) {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { is_completed } = req.body;

    const task = queryOne(`
      SELECT t.*, r.user_id
      FROM tasks t
      JOIN roadmaps r ON t.roadmap_id = r.id
      WHERE t.id = ? AND r.user_id = ?
    `, [taskId, userId]);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'TASK_NOT_FOUND',
        message: 'Task not found or unauthorized.'
      });
    }

    const nextStatus = is_completed ? 1 : 0;
    const completedAt = nextStatus ? new Date().toISOString() : null;

    transaction(() => {
      run(`
        UPDATE tasks
        SET is_completed = ?, completed_at = ?
        WHERE id = ?
      `, [nextStatus, completedAt, taskId]);

      // Recalculate completed tasks for roadmap
      const counts = queryOne(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
        FROM tasks
        WHERE roadmap_id = ?
      `, [task.roadmap_id]);

      const isRoadmapComplete = counts.total > 0 && counts.completed === counts.total;

      run(`
        UPDATE roadmaps
        SET completed_tasks = ?,
            status = CASE WHEN ? = 1 THEN 'completed' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [counts.completed || 0, isRoadmapComplete ? 1 : 0, task.roadmap_id]);

      if (isRoadmapComplete && nextStatus === 1) {
        run(`
          INSERT INTO activity_logs (user_id, action_type, description)
          VALUES (?, 'ROADMAP_COMPLETED', ?)
        `, [userId, `Congratulations! Successfully completed all milestones and tasks in this roadmap!`]);
      }

      // Update milestone status
      const milestoneCounts = queryOne(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
        FROM tasks
        WHERE milestone_id = ?
      `, [task.milestone_id]);

      let milestoneStatus = 'not_started';
      if (milestoneCounts.completed === milestoneCounts.total) {
        milestoneStatus = 'completed';
      } else if (milestoneCounts.completed > 0) {
        milestoneStatus = 'in_progress';
      }

      run(`
        UPDATE milestones
        SET status = ?
        WHERE id = ?
      `, [milestoneStatus, task.milestone_id]);

      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, ?, ?)
      `, [
        userId,
        nextStatus ? 'TASK_COMPLETED' : 'TASK_UNCOMPLETED',
        nextStatus ? `Completed task: "${task.title}"` : `Marked task incomplete: "${task.title}"`
      ]);
    });

    const updatedRoadmap = getHydratedRoadmap(task.roadmap_id);

    return res.json({
      success: true,
      message: nextStatus ? 'Task completed! Great progress.' : 'Task marked incomplete.',
      roadmap: updatedRoadmap
    });
  } catch (err) {
    console.error('[RoadmapController.updateTaskStatus] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update task status.'
    });
  }
}

/**
 * Preview Refinement: Calls AI and returns suggested changes
 * without modifying database yet, so student can review and confirm.
 */
export async function previewRoadmapRefinement(req, res) {
  try {
    const userId = req.user.id;
    const { roadmapId } = req.params;
    const { userFeedback } = req.body;

    if (!userFeedback || !userFeedback.trim()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Please provide instructions or feedback on how to improve your roadmap.'
      });
    }

    if (!isAiConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'AI_NOT_CONFIGURED',
        message: 'Google Gemini API key is not configured.'
      });
    }

    const currentRoadmap = getHydratedRoadmap(roadmapId);
    if (!currentRoadmap || currentRoadmap.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Roadmap not found.'
      });
    }

    const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?', [userId]) || { available_hours_per_week: 8, learning_pace: 'Balanced' };

    // Get list of completed task titles to protect
    const completedTasks = queryAll(`
      SELECT title FROM tasks
      WHERE roadmap_id = ? AND is_completed = 1
    `, [roadmapId]).map(t => t.title);

    const refined = await refineRoadmapWithAi({
      currentRoadmap,
      userFeedback: userFeedback.trim(),
      availableHours: profile.available_hours_per_week,
      learningPace: profile.learning_pace,
      completedTaskTitles: completedTasks
    });

    return res.json({
      success: true,
      message: 'AI refinement preview generated.',
      refinedRoadmap: refined,
      completedTasksPreserved: completedTasks
    });
  } catch (err) {
    console.error('[RoadmapController.previewRoadmapRefinement] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'AI_REFINEMENT_FAILED',
      message: err.message || 'Failed to refine roadmap. Please retry.'
    });
  }
}

/**
 * Apply Refinement: Student confirmed the changes, update DB.
 */
export function applyRoadmapRefinement(req, res) {
  try {
    const userId = req.user.id;
    const { roadmapId } = req.params;
    const { refinedRoadmap } = req.body;

    if (!refinedRoadmap || !Array.isArray(refinedRoadmap.milestones)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid refined roadmap payload.'
      });
    }

    const currentRoadmap = queryOne('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?', [roadmapId, userId]);
    if (!currentRoadmap) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Roadmap not found.'
      });
    }

    // Preserve completed tasks
    const completedTasks = queryAll(`
      SELECT * FROM tasks WHERE roadmap_id = ? AND is_completed = 1
    `, [roadmapId]);
    const completedMap = new Map();
    for (const ct of completedTasks) {
      completedMap.set(ct.title.toLowerCase().trim(), ct);
    }

    transaction(() => {
      // Delete old uncompleted tasks and old milestones
      run('DELETE FROM tasks WHERE roadmap_id = ?', [roadmapId]);
      run('DELETE FROM milestones WHERE roadmap_id = ?', [roadmapId]);

      // Update roadmap metadata
      run(`
        UPDATE roadmaps
        SET title = COALESCE(?, title),
            summary = COALESCE(?, summary),
            total_weeks = COALESCE(?, total_weeks),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [refinedRoadmap.title, refinedRoadmap.summary, refinedRoadmap.total_weeks, roadmapId]);

      let totalTasks = 0;
      let completedCount = 0;

      for (let mIdx = 0; mIdx < refinedRoadmap.milestones.length; mIdx++) {
        const m = refinedRoadmap.milestones[mIdx];
        const mRes = run(`
          INSERT INTO milestones (
            roadmap_id, order_index, title, description, estimated_weeks, prerequisites, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'not_started')
        `, [
          roadmapId,
          m.order_index || (mIdx + 1),
          m.title,
          m.description || '',
          m.estimated_weeks || 2,
          m.prerequisites || ''
        ]);

        const milestoneId = mRes.lastInsertRowid;

        if (Array.isArray(m.tasks)) {
          for (let tIdx = 0; tIdx < m.tasks.length; tIdx++) {
            const t = m.tasks[tIdx];
            totalTasks++;

            // Check if this task was previously completed
            const wasCompleted = completedMap.has(t.title.toLowerCase().trim());
            if (wasCompleted) completedCount++;

            const tRes = run(`
              INSERT INTO tasks (
                milestone_id, roadmap_id, order_index, title, description,
                estimated_hours, completion_criteria, practice_exercises, mini_project, is_completed, completed_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              milestoneId,
              roadmapId,
              t.order_index || (tIdx + 1),
              t.title,
              t.description || '',
              t.estimated_hours || 2.0,
              t.completion_criteria || '',
              t.practice_exercises || '',
              t.mini_project || '',
              wasCompleted ? 1 : 0,
              wasCompleted ? new Date().toISOString() : null
            ]);

            const taskId = tRes.lastInsertRowid;

            // Insert recommended resources for this task (with intelligent matching fallback)
            let resourcesToInsert = Array.isArray(t.recommended_resources) ? [...t.recommended_resources] : [];
            if (resourcesToInsert.length < 2) {
              const matched = findMatchingResources(t.title, t.description, currentRoadmap.title, 3 - resourcesToInsert.length);
              for (const mRes of matched) {
                if (!resourcesToInsert.some(r => r.url === mRes.url || r.title === mRes.title)) {
                  resourcesToInsert.push(mRes);
                }
              }
            }

            for (const r of resourcesToInsert) {
              if (r.title && r.url) {
                run(`
                  INSERT INTO resources (
                    task_id, skill_name, title, url, type, source, is_verified, description
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  taskId,
                  t.title,
                  r.title,
                  r.url,
                  r.type || 'Documentation',
                  r.source || 'Curated',
                  r.is_verified ? 1 : 0,
                  r.description || ''
                ]);
              }
            }
          }
        }
      }

      run(`
        UPDATE roadmaps
        SET total_tasks = ?, completed_tasks = ?
        WHERE id = ?
      `, [totalTasks, completedCount, roadmapId]);

      run(`
        INSERT INTO activity_logs (user_id, action_type, description)
        VALUES (?, 'ROADMAP_REFINED', ?)
      `, [userId, `Refined learning roadmap with AI adjustments (${completedCount} completed tasks preserved).`]);
    });

    const updatedRoadmap = getHydratedRoadmap(roadmapId);

    return res.json({
      success: true,
      message: 'Roadmap refined and applied successfully!',
      roadmap: updatedRoadmap
    });
  } catch (err) {
    console.error('[RoadmapController.applyRoadmapRefinement] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to apply refined roadmap.'
    });
  }
}
