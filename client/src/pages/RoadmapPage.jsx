import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Map,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  ExternalLink,
  BookOpen,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Plus,
  History,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AiStatusBanner from '../components/AiStatusBanner';
import TaskDetailModal from '../components/TaskDetailModal';
import RefineRoadmapModal from '../components/RefineRoadmapModal';
import CreateNewRoadmapModal from '../components/CreateNewRoadmapModal';
import RoadmapHistoryModal from '../components/RoadmapHistoryModal';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedMilestones, setCollapsedMilestones] = useState({});

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedMilestoneTitle, setSelectedMilestoneTitle] = useState('');
  const [refineModalOpen, setRefineModalOpen] = useState(false);
  const [createNewModalOpen, setCreateNewModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.getRoadmap();
      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap);
      } else {
        setRoadmap(null);
      }
    } catch (err) {
      console.error('Fetch roadmap error:', err);
      setError('Could not load roadmap data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const toggleMilestoneCollapse = (milestoneId) => {
    setCollapsedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  const handleToggleTaskStatus = async (taskId, nextStatus) => {
    try {
      const res = await api.updateTaskStatus(taskId, nextStatus);
      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap);
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask({ ...selectedTask, is_completed: nextStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleAskAiAboutTask = (task, milestoneTitle) => {
    navigate('/assistant', {
      state: {
        prefilledQuery: `I need guidance on the roadmap task: "${task.title}". Can you explain the core concepts, recommend practical steps to complete it, and suggest a simple exercise to verify my understanding?`,
        contextTopic: task.title
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your personalized roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AiStatusBanner />

      {/* Roadmap Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary">Personalized Engineering Roadmap</span>
            {roadmap && (
              <span className="badge badge-neutral">
                {roadmap.weekly_hours} hrs/week • {roadmap.target_pace} Pace
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {roadmap?.title || 'My Learning Roadmap'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', marginTop: '4px' }}>
            {roadmap?.summary || 'Follow this structured milestone sequence to build competence and practical portfolio deliverables.'}
          </p>
        </div>

        {roadmap && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCreateNewModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>New Roadmap</span>
            </button>

            <button
              onClick={() => setHistoryModalOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={16} />
              <span>History</span>
            </button>

            <button
              onClick={() => setRefineModalOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} color="var(--primary)" />
              <span>Improve Roadmap</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State: No Roadmap */}
      {!roadmap ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-lg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Map size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            You Don't Have an Active Roadmap Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
            Complete the quick onboarding to let Google Gemini formulate your milestone plan based on your current knowledge and available hours.
          </p>
          <Link to="/onboarding" className="btn btn-primary btn-lg">
            <span>Create My Roadmap</span>
          </Link>
        </div>
      ) : (
        /* Milestones Timeline */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Roadmap Completion Celebration Banner */}
          {roadmap.completion_percentage === 100 && (
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                border: '1.5px solid #86efac',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Trophy size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-success" style={{ fontWeight: 800 }}>Course Completed</span>
                    <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>100% Mastery</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', marginBottom: '4px' }}>
                    🎉 Outstanding Work! You Finished This Entire Roadmap!
                  </h3>
                  <p style={{ color: '#166534', fontSize: '0.9rem', maxWidth: '580px', lineHeight: '1.5' }}>
                    You have successfully completed all {roadmap.total_tasks} tasks across {roadmap.milestones?.length} milestones for "{roadmap.title}". Ready to tackle your next engineering goal?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setCreateNewModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', borderColor: '#16a34a' }}
                >
                  <Sparkles size={16} />
                  <span>Generate Next Roadmap</span>
                </button>
                <button
                  onClick={() => setHistoryModalOpen(true)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <History size={16} />
                  <span>Past Roadmaps</span>
                </button>
              </div>
            </div>
          )}

          {/* Progress Header Strip */}
          <div className="card" style={{ padding: '16px 20px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '240px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Completion Status
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {roadmap.completion_percentage}% ({roadmap.completed_tasks} / {roadmap.total_tasks} Tasks)
                </div>
              </div>
              <div style={{ flex: 1, maxWidth: '280px' }}>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div className="progress-fill" style={{ width: `${roadmap.completion_percentage}%` }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
              <span className="badge badge-neutral">
                {roadmap.milestones?.length || 0} Total Milestones
              </span>
              <span className="badge badge-success">
                {roadmap.milestones?.filter(m => m.is_completed).length || 0} Milestones Cleared
              </span>
            </div>
          </div>

          {/* Milestones List */}
          {roadmap.milestones?.map((milestone, mIdx) => {
            const isCollapsed = Boolean(collapsedMilestones[milestone.id]);
            const isCompleted = milestone.is_completed;
            const completedCount = milestone.completed_count || 0;
            const totalCount = milestone.total_count || 0;

            return (
              <div
                key={milestone.id}
                className="card"
                style={{
                  border: isCompleted ? '1px solid #bbf7d0' : '1px solid var(--border-light)',
                  padding: '24px'
                }}
              >
                {/* Milestone Card Header */}
                <div
                  onClick={() => toggleMilestoneCollapse(milestone.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isCompleted ? '#dcfce7' : 'var(--primary-light)',
                        color: isCompleted ? '#16a34a' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}
                    >
                      {isCompleted ? <CheckCircle2 size={20} /> : mIdx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {milestone.title}
                        </h3>
                        {isCompleted && <span className="badge badge-success">Milestone Completed</span>}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>Est. Duration: {milestone.estimated_weeks} weeks</span>
                        <span>•</span>
                        <span>{completedCount} of {totalCount} tasks completed</span>
                        {milestone.prerequisites && (
                          <>
                            <span>•</span>
                            <span>Prereq: {milestone.prerequisites}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-muted)' }}>
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Milestone Description */}
                {!isCollapsed && milestone.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '12px', marginBottom: '16px', lineHeight: '1.5' }}>
                    {milestone.description}
                  </p>
                )}

                {/* Tasks List */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {milestone.tasks?.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: task.is_completed ? '#f0fdf4' : '#f8fafc',
                          border: task.is_completed ? '1px solid #bbf7d0' : '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.15s ease',
                          gap: '12px'
                        }}
                      >
                        {/* Checkbox & Task Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task.id, !task.is_completed)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: task.is_completed ? '#16a34a' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              padding: 0
                            }}
                            title={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {task.is_completed ? (
                              <CheckCircle2 size={22} />
                            ) : (
                              <Circle size={22} />
                            )}
                          </button>

                          <div>
                            <div
                              onClick={() => {
                                setSelectedTask(task);
                                setSelectedMilestoneTitle(milestone.title);
                              }}
                              style={{
                                fontWeight: 600,
                                fontSize: '0.925rem',
                                color: task.is_completed ? '#166534' : 'var(--text-primary)',
                                textDecoration: task.is_completed ? 'line-through' : 'none',
                                cursor: 'pointer'
                              }}
                            >
                              {task.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                              <span>{task.estimated_hours} hrs</span>
                              {task.completion_criteria && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Criteria verified</span>
                                </>
                              )}
                              {task.resources && task.resources.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{task.resources.length} resources</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleAskAiAboutTask(task, milestone.title)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '5px 9px' }}
                            title="Ask AI Learning Mentor about this specific task"
                          >
                            <Sparkles size={13} color="var(--primary)" />
                            <span>Ask AI</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setSelectedMilestoneTitle(milestone.title);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '5px 9px' }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          milestoneTitle={selectedMilestoneTitle}
          onClose={() => setSelectedTask(null)}
          onToggleStatus={handleToggleTaskStatus}
        />
      )}

      {/* Refine Roadmap Modal */}
      {refineModalOpen && roadmap && (
        <RefineRoadmapModal
          roadmap={roadmap}
          onClose={() => setRefineModalOpen(false)}
          onRefinementApplied={(updatedRoadmap) => {
            setRoadmap(updatedRoadmap);
          }}
        />
      )}

      {/* Create New Roadmap Modal */}
      {createNewModalOpen && (
        <CreateNewRoadmapModal
          defaultHours={roadmap?.weekly_hours || 8}
          defaultPace={roadmap?.target_pace || 'Balanced'}
          onClose={() => setCreateNewModalOpen(false)}
          onRoadmapCreated={(newRoadmap) => {
            setRoadmap(newRoadmap);
          }}
        />
      )}

      {/* Roadmap History Modal */}
      {historyModalOpen && (
        <RoadmapHistoryModal
          currentRoadmapId={roadmap?.id}
          onClose={() => setHistoryModalOpen(false)}
          onSelectRoadmap={(selectedRoadmap) => {
            setRoadmap(selectedRoadmap);
          }}
          onStartNew={() => {
            setCreateNewModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
