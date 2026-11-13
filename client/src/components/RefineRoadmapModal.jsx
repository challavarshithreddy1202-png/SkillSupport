import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Layers,
  Clock,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';

export default function RefineRoadmapModal({ roadmap, onClose, onRefinementApplied }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'preview'
  const [previewData, setPreviewData] = useState(null);
  const [applying, setApplying] = useState(false);

  const suggestionChips = [
    'I have less study time this month (reduce weekly hours)',
    'I already know the basics, skip introductory syntax',
    'I want more hands-on practical portfolio projects',
    'This topic is too difficult, break it into smaller steps',
    'I want to focus more deeply on real-world engineering APIs'
  ];

  const handleRequestRefinement = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setError('Please provide your requested adjustments or learning feedback.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.previewRoadmapRefinement(roadmap.id, feedback.trim());
      if (res.success && res.refinedRoadmap) {
        setPreviewData(res.refinedRoadmap);
        setStep('preview');
      } else {
        setError(res.message || 'AI was unable to generate a refinement preview.');
      }
    } catch (err) {
      setError(err.message || 'Failed to refine roadmap. Please verify your AI API configuration and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRefinement = async () => {
    if (!previewData) return;
    setApplying(true);
    setError('');

    try {
      const res = await api.applyRoadmapRefinement(roadmap.id, previewData);
      if (res.success && res.roadmap) {
        onRefinementApplied(res.roadmap);
        onClose();
      } else {
        setError(res.message || 'Failed to apply roadmap adjustments.');
      }
    } catch (err) {
      setError(err.message || 'Failed to apply roadmap adjustments.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Improve My Roadmap</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {step === 'input'
                  ? 'Tell the AI what changes you need — your completed tasks will be protected.'
                  : 'Review the AI adjustments before applying them to your active roadmap.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="alert-banner alert-banner-warning" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {step === 'input' ? (
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>
                How would you like to adapt your roadmap?
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., I have an exam next week and only 4 hours to study, so please adapt the timeline, or I already know Git and want more database practice..."
                style={{ fontSize: '0.9rem', marginBottom: '12px' }}
              />

              {/* Suggestions */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Quick Suggestions:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedback(chip)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.775rem', padding: '4px 10px', background: '#f8fafc' }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safe Guard Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px' }}>
                <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.825rem', color: '#166534', lineHeight: '1.45' }}>
                  <strong>Completed Work is Safe:</strong> Your {roadmap.completed_tasks || 0} completed tasks will remain safely recorded and won't be lost.
                </div>
              </div>
            </div>
          ) : (
            /* Review / Preview Step */
            <div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: '#1e40af', marginBottom: '6px' }}>
                  <Sparkles size={16} /> AI Adjustment Summary
                </div>
                <p style={{ color: '#1e3a8a', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {previewData.change_summary || 'The roadmap schedule and topic depth have been adjusted to match your requested pace.'}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
                  Updated Roadmap Overview ({previewData.milestones?.length || 0} Milestones)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {previewData.milestones?.map((m, mIdx) => (
                    <div key={mIdx} style={{ background: '#f8fafc', border: '1px solid var(--border-light)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {m.title}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                          {m.estimated_weeks} weeks • {m.tasks?.length || 0} tasks
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Clicking "Apply Improvements" will update your roadmap schedule. You can always refine it again later.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step === 'input' ? (
            <>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestRefinement}
                disabled={loading || !feedback.trim()}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Adjustments
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                disabled={applying}
                className="btn btn-secondary"
              >
                <RotateCcw size={15} /> Edit Feedback
              </button>
              <button
                type="button"
                onClick={handleApplyRefinement}
                disabled={applying}
                className="btn btn-primary"
              >
                {applying ? (
                  <>
                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Applying Roadmap...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Apply Improvements
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
