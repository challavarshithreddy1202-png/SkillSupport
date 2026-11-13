import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Map,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  ListTodo,
  Plus,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AiStatusBanner from '../components/AiStatusBanner';
import TaskDetailModal from '../components/TaskDetailModal';
import RefineRoadmapModal from '../components/RefineRoadmapModal';
import CreateNewRoadmapModal from '../components/CreateNewRoadmapModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, activeGoal, refreshUser } = useAuth();

  const [roadmap, setRoadmap] = useState(null);
  const [progressSummary, setProgressSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskMilestone, setSelectedTaskMilestone] = useState('');
  const [refineModalOpen, setRefineModalOpen] = useState(false);
  const [createNewModalOpen, setCreateNewModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roadmapRes, progressRes] = await Promise.all([
        api.getRoadmap(),
        api.getProgress()
      ]);

      if (roadmapRes.success) {
        setRoadmap(roadmapRes.roadmap);
      }
      if (progressRes.success) {
        setProgressSummary(progressRes.summary);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTask = async (taskId, nextStatus) => {
    try {
      const res = await api.updateTaskStatus(taskId, nextStatus);
      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap);
        // Refresh progress
        const progRes = await api.getProgress();
        if (progRes.success) {
          setProgressSummary(progRes.summary);
        }
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask({ ...selectedTask, is_completed: nextStatus });
        }
      }
    } catch (err) {
      console.error('Task update failed:', err);
    }
  };

  // Find next recommended task and active milestone
  let activeMilestone = null;
  let nextTask = null;
  let recentCompletedTasks = [];
  let pendingTasksInActiveMilestone = [];

  if (roadmap && roadmap.milestones) {
    for (const m of roadmap.milestones) {
      for (const t of m.tasks) {
        if (t.is_completed) {
          recentCompletedTasks.push({ ...t, milestoneTitle: m.title });
        } else if (!nextTask) {
          nextTask = { ...t, milestoneTitle: m.title };
          activeMilestone = m;
        }
      }
      if (nextTask) {
        activeMilestone = m;
        pendingTasksInActiveMilestone = m.tasks.filter(t => !t.is_completed);
        break;
      }
    }
    // Reverse recent completed for recency
    recentCompletedTasks = recentCompletedTasks.slice(-4).reverse();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AiStatusBanner />

      {/* Header Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Hello, {user?.name || 'Engineer'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {user?.branch} • {user?.year_of_study || 'Undergraduate'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCreateNewModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>New Roadmap</span>
          </button>
          {roadmap && (
            <button
              onClick={() => setRefineModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={15} color="var(--primary)" />
              <span>Improve Roadmap</span>
            </button>
          )}
          <Link
            to="/assistant"
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={15} />
            <span>Ask AI Mentor</span>
          </Link>
        </div>
      </div>

      {/* Empty State: No Roadmap Yet */}
      {!roadmap ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-lg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Map size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            No Active Learning Roadmap Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
            Define your learning goals, current skills, and study budget. SkillSupport will employ Gemini AI to construct a personalized path.
          </p>
          <Link to="/onboarding" className="btn btn-primary btn-lg">
            <span>Build My Roadmap</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        /* Populated Dashboard */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Row: Goal & Progress Overview Cards */}
          <div className="grid-3">
            {/* Active Goal Card */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <span className="card-subtitle" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Current Goal</span>
                <span className="badge badge-primary">Active</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {activeGoal?.title || roadmap.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {activeGoal?.description || roadmap.summary || 'Working towards professional engineering proficiency.'}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <Link to="/skill-gap" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                  View Skill-Gap Diagnosis
                </Link>
              </div>
            </div>

            {/* Roadmap Completion Progress Card */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <span className="card-subtitle" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Overall Progress</span>
                <span className="badge badge-success">{roadmap.completion_percentage}% Done</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {roadmap.completion_percentage}%
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ({roadmap.completed_tasks} of {roadmap.total_tasks} tasks)
                </span>
              </div>
              <div className="progress-track" style={{ height: '8px', marginBottom: '12px' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${roadmap.completion_percentage}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Milestones: {progressSummary?.completedMilestones || 0} / {progressSummary?.totalMilestones || 0}</span>
                <span>{roadmap.weekly_hours} hrs / week</span>
              </div>
            </div>

            {/* Active Milestone Card */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <span className="card-subtitle" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Current Milestone</span>
                <span className="badge badge-neutral">In Progress</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {activeMilestone ? activeMilestone.title : 'All Milestones Cleared! 🎉'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {activeMilestone?.description || 'You have completed all milestones in your active roadmap!'}
              </p>
              <div style={{ marginTop: '16px' }}>
                <Link to="/roadmap" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                  Open Roadmap Timeline
                </Link>
              </div>
            </div>
          </div>

          {/* Next Recommended Task Highlight */}
          {nextTask && (
            <div
              className="card"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                border: '1.5px solid var(--primary-border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-primary">Next Recommended Task</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{nextTask.milestoneTitle}</span>
                </div>
                <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {nextTask.estimated_hours} hrs estimated
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {nextTask.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {nextTask.description}
                  </p>
                  {nextTask.completion_criteria && (
                    <div style={{ marginTop: '8px', fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Criteria: {nextTask.completion_criteria}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setSelectedTask(nextTask);
                      setSelectedTaskMilestone(nextTask.milestoneTitle);
                    }}
                    className="btn btn-secondary"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleToggleTask(nextTask.id, true)}
                    className="btn btn-primary"
                  >
                    <CheckCircle2 size={16} /> Mark Completed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All Tasks Completed Celebration Card */}
          {!nextTask && roadmap && roadmap.total_tasks > 0 && (
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                border: '1.5px solid #86efac',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Trophy size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-success" style={{ fontWeight: 800 }}>Roadmap 100% Completed</span>
                      <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>All Milestones Cleared</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', marginBottom: '4px' }}>
                      🎉 Congratulations! You Finished Your Entire Roadmap!
                    </h3>
                    <p style={{ color: '#166534', fontSize: '0.9rem', maxWidth: '540px', lineHeight: '1.5' }}>
                      You have completed all {roadmap.total_tasks} tasks for "{activeGoal?.title || roadmap.title}". What new engineering specialization would you like to master next?
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setCreateNewModalOpen(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', borderColor: '#16a34a' }}
                  >
                    <Sparkles size={16} />
                    <span>Generate New Roadmap</span>
                  </button>
                  <Link to="/roadmap" className="btn btn-secondary">
                    Review Roadmap
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Grid: Current Planned Tasks & Recently Completed */}
          <div className="grid-2">
            {/* Planned Tasks in Current Milestone */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <ListTodo size={18} color="var(--primary)" />
                  <span>Planned for this Milestone</span>
                </div>
                <span className="badge badge-neutral">
                  {pendingTasksInActiveMilestone.length} remaining
                </span>
              </div>

              {pendingTasksInActiveMilestone.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                  No pending tasks in this phase. Proceed to next milestone or refine your plan.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingTasksInActiveMilestone.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {task.estimated_hours} hrs • {task.completion_criteria ? 'Specific criteria set' : 'Standard review'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setSelectedTaskMilestone(activeMilestone?.title || 'Milestone');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleToggleTask(task.id, true)}
                          className="btn btn-subtle btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Quick complete"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Completed Tasks */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <CheckCircle2 size={18} color="var(--success)" />
                  <span>Recently Completed</span>
                </div>
                <span className="badge badge-success">
                  {recentCompletedTasks.length} recorded
                </span>
              </div>

              {recentCompletedTasks.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                  No tasks completed yet. Complete your first task to start your streak!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentCompletedTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '10px 14px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#166534', textDecoration: 'line-through' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                          {task.milestoneTitle}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleTask(task.id, false)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                        title="Mark incomplete"
                      >
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          milestoneTitle={selectedTaskMilestone}
          onClose={() => setSelectedTask(null)}
          onToggleStatus={handleToggleTask}
        />
      )}

      {/* Refine Roadmap Modal */}
      {refineModalOpen && roadmap && (
        <RefineRoadmapModal
          roadmap={roadmap}
          onClose={() => setRefineModalOpen(false)}
          onRefinementApplied={(updatedRoadmap) => {
            setRoadmap(updatedRoadmap);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
