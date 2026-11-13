import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  Clock,
  Target,
  Code2,
  FolderGit2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function TaskDetailModal({ task, milestoneTitle, onClose, onToggleStatus }) {
  const navigate = useNavigate();

  if (!task) return null;

  const handleAskAi = () => {
    onClose();
    navigate('/assistant', {
      state: {
        prefilledQuery: `I need guidance on the roadmap task: "${task.title}". Can you break down how I should approach this, clarify key concepts, and give me a concrete tip for the practice exercise?`,
        contextTopic: task.title
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-primary">{milestoneTitle || 'Milestone Task'}</span>
              <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {task.estimated_hours} hrs estimated
              </span>
              {task.is_completed ? (
                <span className="badge badge-success">Completed</span>
              ) : (
                <span className="badge badge-neutral">In Progress</span>
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Description */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Concept & Objectives
            </h4>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {task.description || 'Learn and apply fundamental concepts required for this milestone.'}
            </p>
          </div>

          {/* Completion Criteria */}
          {task.completion_criteria && (
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '4px' }}>
                <Target size={16} /> Completion Criteria
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {task.completion_criteria}
              </p>
            </div>
          )}

          {/* Practice Exercise */}
          {task.practice_exercises && (
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#0284c7', marginBottom: '4px' }}>
                <Code2 size={16} /> Hands-on Practice Exercise
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {task.practice_exercises}
              </p>
            </div>
          )}

          {/* Mini Project */}
          {task.mini_project && (
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#16a34a', marginBottom: '4px' }}>
                <FolderGit2 size={16} /> Portfolio Mini-Deliverable
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {task.mini_project}
              </p>
            </div>
          )}

          {/* Recommended Resources */}
          {task.resources && task.resources.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Recommended Learning Material
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.resources.map((res) => (
                  <a
                    key={res.id || res.title}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card"
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textDecoration: 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {res.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span>{res.source}</span>
                        <span>•</span>
                        <span>{res.type}</span>
                        {res.is_verified ? (
                          <span style={{ color: 'var(--success-text)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                            <ShieldCheck size={12} /> Verified
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unverified Link</span>
                        )}
                      </div>
                    </div>
                    <ExternalLink size={16} color="var(--primary)" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            onClick={handleAskAi}
            className="btn btn-subtle"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={16} /> Ask AI Mentor
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onToggleStatus(task.id, !task.is_completed)}
              className={`btn ${task.is_completed ? 'btn-secondary' : 'btn-primary'}`}
            >
              <CheckCircle2 size={16} />
              {task.is_completed ? 'Mark Incomplete' : 'Mark as Completed'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
