import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function RoadmapHistoryModal({ currentRoadmapId, onClose, onSelectRoadmap, onStartNew }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await api.getRoadmapHistory();
        if (res.success && res.roadmaps) {
          setHistory(res.roadmaps);
        }
      } catch (err) {
        console.error('Fetch roadmap history error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const handleSelect = async (roadmapId) => {
    try {
      const res = await api.getRoadmapById(roadmapId);
      if (res.success && res.roadmap) {
        onSelectRoadmap(res.roadmap);
        onClose();
      }
    } catch (err) {
      console.error('Load past roadmap error:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <History size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Your Roadmap History</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Review past and active roadmaps or start a new specialization.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px' }}>
              <div className="animate-spin" style={{ width: '28px', height: '28px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 10px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading roadmap archives...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px' }}>
              <p style={{ color: 'var(--text-muted)' }}>No previous roadmaps recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((r) => {
                const isCurrent = r.id === currentRoadmapId;
                const isCompleted = r.is_completed || r.status === 'completed';

                return (
                  <div
                    key={r.id}
                    className="card"
                    style={{
                      padding: '16px',
                      border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                      background: isCurrent ? '#f8fafc' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {r.title}
                          </h4>
                          {isCurrent && <span className="badge badge-primary">Active</span>}
                          {isCompleted && (
                            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={12} /> Completed
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                          <span>Created: {new Date(r.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{r.total_weeks} weeks</span>
                          <span>•</span>
                          <span>{r.weekly_hours} hrs/week</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isCurrent && (
                          <button
                            onClick={() => handleSelect(r.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>View Roadmap</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {r.completed_tasks} of {r.total_tasks} tasks completed
                        </span>
                        <span style={{ fontWeight: 700, color: isCompleted ? 'var(--success)' : 'var(--primary)' }}>
                          {r.completion_percentage}%
                        </span>
                      </div>
                      <div className="progress-track" style={{ height: '6px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${r.completion_percentage}%`,
                            background: isCompleted ? 'var(--success)' : 'var(--primary)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            onClick={() => {
              onClose();
              onStartNew();
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={15} />
            <span>+ Start a New Roadmap</span>
          </button>

          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
