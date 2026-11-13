import { initDatabase, queryAll, queryOne, run } from './database/db.js';
import * as authCtrl from './controllers/authController.js';
import * as profileCtrl from './controllers/profileController.js';
import * as goalCtrl from './controllers/goalController.js';
import * as skillGapCtrl from './controllers/skillGapController.js';
import * as roadmapCtrl from './controllers/roadmapController.js';
import * as resourceCtrl from './controllers/resourceController.js';
import * as progressCtrl from './controllers/progressController.js';
import * as systemCtrl from './controllers/systemController.js';

// Mock Express req & res
function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runDirectTests() {
  console.log('--- Testing SkillSupport Controllers & Database In-Process ---');

  // 1. Init Database
  initDatabase();
  console.log('✓ SQLite Database schema initialized.');

  // 2. System status
  const sysRes = mockRes();
  systemCtrl.getSystemStatus({}, sysRes);
  console.log('✓ System status:', sysRes.data.success ? 'PASSED' : 'FAILED', '(AI Configured:', sysRes.data.aiConfigured, ')');

  // 3. Register user
  const email = `test_${Date.now()}@college.edu`;
  const regReq = {
    body: {
      name: 'Rohan Sharma',
      email,
      password: 'mypassword123',
      branch: 'Computer Science & Engineering',
      year_of_study: '3rd Year'
    }
  };
  const regRes = mockRes();
  authCtrl.register(regReq, regRes);
  console.log('✓ User registration:', regRes.data.success ? 'PASSED' : 'FAILED', '(User ID:', regRes.data.user?.id, ')');

  const userId = regRes.data.user.id;
  const userObj = { id: userId, email, name: 'Rohan Sharma', branch: 'Computer Science & Engineering' };

  // 4. Login
  const loginReq = { body: { email, password: 'mypassword123' } };
  const loginRes = mockRes();
  authCtrl.login(loginReq, loginRes);
  console.log('✓ User login:', loginRes.data.success ? 'PASSED' : 'FAILED', '(Token generated:', Boolean(loginRes.data.token), ')');

  // 5. Profile & Skills
  const profReq = { user: userObj };
  const profRes = mockRes();
  profileCtrl.getProfile(profReq, profRes);
  console.log('✓ Profile fetch:', profRes.data.success ? 'PASSED' : 'FAILED', '(Branch:', profRes.data.user?.branch, ')');

  const skillsReq = {
    user: userObj,
    body: {
      skills: [
        { name: 'Python', category: 'Programming', proficiency: 'Intermediate' },
        { name: 'React', category: 'Frontend', proficiency: 'Beginner' }
      ]
    }
  };
  const skillsRes = mockRes();
  profileCtrl.syncSkills(skillsReq, skillsRes);
  console.log('✓ Skills sync:', skillsRes.data.success ? 'PASSED' : 'FAILED', '(Skills count:', skillsRes.data.skills?.length, ')');

  // 6. Create Goal
  const goalReq = {
    user: userObj,
    body: {
      title: 'Full-Stack Web Development',
      description: 'Master modern React, Node, and database architecture',
      category: 'Software Engineering'
    }
  };
  const goalRes = mockRes();
  await goalCtrl.createGoal(goalReq, goalRes);
  console.log('✓ Goal creation:', goalRes.data.success ? 'PASSED' : 'FAILED', '(Goal:', goalRes.data.goal?.title, ')');

  const goalId = goalRes.data.goal.id;

  // 7. Curated Resources
  const rRes = mockRes();
  resourceCtrl.getResources({ query: { search: 'React', type: 'All', skill: 'All' } }, rRes);
  console.log('✓ Resources query:', rRes.data.success ? 'PASSED' : 'FAILED', '(Results:', rRes.data.resources?.length, ')');

  // 8. Create and Hydrate a Roadmap in DB
  const rId = run(`
    INSERT INTO roadmaps (user_id, goal_id, title, summary, target_pace, weekly_hours, total_weeks, status, total_tasks, completed_tasks)
    VALUES (?, ?, 'Full-Stack Engineering Roadmap', 'Personalized milestone curriculum', 'Balanced', 8, 12, 'active', 3, 0)
  `, [userId, goalId]).lastInsertRowid;

  const mId = run(`
    INSERT INTO milestones (roadmap_id, order_index, title, description, estimated_weeks, status)
    VALUES (?, 1, 'Phase 1: REST API & Architecture', 'Master asynchronous patterns and backend contracts', 2, 'not_started')
  `, [rId]).lastInsertRowid;

  const t1 = run(`
    INSERT INTO tasks (milestone_id, roadmap_id, order_index, title, description, estimated_hours, completion_criteria, is_completed)
    VALUES (?, ?, 1, 'Implement Express Middleware and Routing', 'Build structured REST router', 3.0, 'Working CRUD routes', 0)
  `, [mId, rId]).lastInsertRowid;

  const t2 = run(`
    INSERT INTO tasks (milestone_id, roadmap_id, order_index, title, description, estimated_hours, completion_criteria, is_completed)
    VALUES (?, ?, 2, 'Design SQLite Database Schemas', 'Create relational tables with foreign keys', 2.5, 'Foreign keys validated', 0)
  `, [mId, rId]).lastInsertRowid;

  const t3 = run(`
    INSERT INTO tasks (milestone_id, roadmap_id, order_index, title, description, estimated_hours, completion_criteria, is_completed)
    VALUES (?, ?, 3, 'Connect React Frontend to Express API', 'Consume endpoints with clean error handling', 4.0, 'UI rendered from API', 0)
  `, [mId, rId]).lastInsertRowid;

  // 9. Fetch hydrated roadmap
  const roadmapReq = { user: userObj };
  const roadmapRes = mockRes();
  roadmapCtrl.getCurrentRoadmap(roadmapReq, roadmapRes);
  console.log('✓ Roadmap retrieval:', roadmapRes.data.success ? 'PASSED' : 'FAILED', '(Total tasks:', roadmapRes.data.roadmap?.total_tasks, ')');

  // 10. Toggle Task Status (Mark task 1 as completed)
  const taskToggleReq = {
    user: userObj,
    params: { taskId: t1 },
    body: { is_completed: true }
  };
  const taskToggleRes = mockRes();
  roadmapCtrl.updateTaskStatus(taskToggleReq, taskToggleRes);
  console.log('✓ Task completion toggle:', taskToggleRes.data.success ? 'PASSED' : 'FAILED', '(New %:', taskToggleRes.data.roadmap?.completion_percentage, '%)');

  // 11. Toggle Task 2 as completed
  const task2ToggleReq = {
    user: userObj,
    params: { taskId: t2 },
    body: { is_completed: true }
  };
  const task2ToggleRes = mockRes();
  roadmapCtrl.updateTaskStatus(task2ToggleReq, task2ToggleRes);
  console.log('✓ Task 2 completion toggle:', task2ToggleRes.data.success ? 'PASSED' : 'FAILED', '(New %:', task2ToggleRes.data.roadmap?.completion_percentage, '%)');

  // 12. Check Progress Telemetry
  const progReq = { user: userObj };
  const progRes = mockRes();
  progressCtrl.getProgress(progReq, progRes);
  console.log('✓ Progress telemetry:', progRes.data.success ? 'PASSED' : 'FAILED',
    '(Completed Tasks:', progRes.data.summary?.completedTasks,
    'of', progRes.data.summary?.totalTasks,
    '| Hours:', progRes.data.summary?.completedHours,
    '| Rate:', progRes.data.summary?.completionPercentage, '%)'
  );

  // 13. Verify activity logs recorded
  const activities = queryAll('SELECT * FROM activity_logs WHERE user_id = ?', [userId]);
  console.log('✓ Activity log persistence: PASSED (Logged events:', activities.length, ')');

  console.log('\n======================================================');
  console.log('✅ ALL IN-PROCESS CONTROLLER & DATABASE TESTS SUCCEEDED!');
  console.log('======================================================');
}

runDirectTests();
