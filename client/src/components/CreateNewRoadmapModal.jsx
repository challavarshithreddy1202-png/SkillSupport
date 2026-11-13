import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Target,
  Clock,
  Zap,
  BookOpen,
  AlertCircle,
  Plus,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function CreateNewRoadmapModal({ onClose, onRoadmapCreated, defaultPace = 'Balanced', defaultHours = 8 }) {
  const [goalTitle, setGoalTitle] = useState('');
  const [availableHours, setAvailableHours] = useState(defaultHours);
  const [learningPace, setLearningPace] = useState(defaultPace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const popularGoalSuggestions = [
    'Full-Stack AI Integration & APIs',
    'Machine Learning & Deep Learning with PyTorch',
    'Data Structures & Algorithms in C/C++',
    'Embedded Systems & IoT Firmware (ESP32)',
    'Cloud DevOps, Docker & Microservices',
    'Cybersecurity & Web Application Defense',
    'Python for Automation & Data Analysis'
  ];

  const handleSelectSuggestion = (title) => {
    setGoalTitle(title);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      setError('Please specify a title for your next learning goal.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.startNewRoadmap({
        goalTitle: goalTitle.trim(),
        availableHours: Number(availableHours),
        learningPace,
        goalCategory: 'Engineering Development'
      });

      if (res.success && res.roadmap) {
        onRoadmapCreated(res.roadmap);
        onClose();
      } else {
        setError(res.message || 'Failed to generate new roadmap.');
      }
    } catch (err) {
      console.error('Create new roadmap error:', err);
      setError(err.message || 'Failed to generate roadmap. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Start a New Learning Roadmap</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your completed work will be archived in your history so you can view it anytime.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div className="alert-banner alert-banner-warning">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Goal Title Input */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                What would you like to master next?
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Full-Stack AI Integration, Computer Vision, Docker & Kubernetes..."
                value={goalTitle}
                onChange={(e) => {
                  setGoalTitle(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                autoFocus
              />

              {/* Suggestions */}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Quick Ideas:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {popularGoalSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectSuggestion(item)}
                      style={{
                        background: goalTitle === item ? 'var(--primary)' : '#f1f5f9',
                        color: goalTitle === item ? '#ffffff' : 'var(--text-primary)',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule & Pace Settings */}
            <div className="grid-2" style={{ gap: '14px' }}>
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Clock size={15} color="var(--primary)" />
                  Available Study Time
                </label>
                <select
                  className="form-select"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  disabled={loading}
                >
                  <option value={4}>4 hours / week (Light)</option>
                  <option value={6}>6 hours / week (Focused)</option>
                  <option value={8}>8 hours / week (Standard)</option>
                  <option value={12}>12 hours / week (Dedicated)</option>
                  <option value={16}>16 hours / week (Intensive)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Zap size={15} color="var(--primary)" />
                  Learning Pace
                </label>
                <select
                  className="form-select"
                  value={learningPace}
                  onChange={(e) => setLearningPace(e.target.value)}
                  disabled={loading}
                >
                  <option value="Relaxed">Relaxed (More practice time)</option>
                  <option value="Balanced">Balanced (Steady progress)</option>
                  <option value="Intensive">Intensive (Fast-track depth)</option>
                </select>
              </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div className="animate-spin" style={{ width: '28px', height: '28px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Synthesizing Your Next Learning Roadmap...
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Structuring 4 comprehensive milestones, practical tasks, and verified resources.
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !goalTitle.trim()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} />
              <span>{loading ? 'Synthesizing...' : 'Generate New Roadmap'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
