import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SplitSquareVertical,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AiStatusBanner from '../components/AiStatusBanner';

export default function SkillGapPage() {
  const { user, activeGoal, aiStatus } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSkillGap = async () => {
    setLoading(true);
    try {
      const res = await api.getSkillGap();
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      console.error('Error fetching skill gap:', err);
      setError('Failed to load skill-gap analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillGap();
  }, []);

  const handleRefreshAnalysis = async () => {
    if (!aiStatus.configured) {
      setError('Gemini API key is required to generate AI skill-gap diagnosis.');
      return;
    }

    setRefreshing(true);
    setError('');

    try {
      const res = await api.generateSkillGap();
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);
      } else {
        setError(res.message || 'Failed to generate diagnostic.');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete AI diagnostic.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading skill-gap diagnostic...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AiStatusBanner />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary">Skill-Gap Intelligence</span>
            {analysis?.is_ai_generated && (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> AI Verified Diagnostic
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Skill-Gap Analysis
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', marginTop: '4px' }}>
            Comparing your self-reported profile against competencies required for "{activeGoal?.title || 'Target Goal'}".
          </p>
        </div>

        <button
          onClick={handleRefreshAnalysis}
          disabled={refreshing}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Analyzing...' : 'Refresh AI Diagnostic'}</span>
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-banner-warning" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!analysis ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-lg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <SplitSquareVertical size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            No Skill-Gap Diagnostic On File
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
            Run an AI diagnostic to map out what you already know against what the industry expects for your target role.
          </p>
          <button
            onClick={handleRefreshAnalysis}
            disabled={refreshing}
            className="btn btn-primary btn-lg"
          >
            <Sparkles size={18} />
            <span>{refreshing ? 'Generating Diagnostic...' : 'Run Skill-Gap Analysis'}</span>
          </button>
        </div>
      ) : (
        /* Analysis Results */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI Diagnostic Summary Card */}
          <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>AI Readiness Assessment</h3>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {analysis.summary}
            </p>
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Diagnostic evaluated on {new Date(analysis.created_at).toLocaleDateString()} based on student-reported skills and course goals.
            </div>
          </div>

          {/* Current Skills Alignment */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CheckCircle2 size={18} color="var(--success)" />
                <span>Existing Skills & Alignment</span>
              </div>
              <span className="badge badge-success">
                {analysis.existing_skills_alignment?.length || 0} Skills Assessed
              </span>
            </div>

            {analysis.existing_skills_alignment?.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No prior skills were registered during onboarding.
              </p>
            ) : (
              <div className="grid-3" style={{ gap: '14px' }}>
                {analysis.existing_skills_alignment?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.skill}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {item.current_level}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>
                      Relevance: {item.relevance_to_goal}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.assessment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills Needing Development */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Target size={18} color="var(--primary)" />
                <span>Skills to Develop for Target Goal</span>
              </div>
              <span className="badge badge-primary">
                {analysis.skills_to_develop?.length || 0} Key Competencies
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {analysis.skills_to_develop?.map((skill, idx) => {
                let badgeClass = 'badge-neutral';
                if (skill.priority === 'High') badgeClass = 'badge-danger';
                if (skill.priority === 'Medium') badgeClass = 'badge-warning';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {skill.skill}
                          </h4>
                          <span className={`badge ${badgeClass}`}>{skill.priority} Priority</span>
                          {skill.category && <span className="badge badge-neutral">{skill.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Why this skill matters:
                      </span>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.5' }}>
                        {skill.why_it_matters}
                      </p>
                    </div>

                    {skill.suggested_action && (
                      <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Action Plan: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{skill.suggested_action}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Learning Priorities */}
          {analysis.recommended_priorities && analysis.recommended_priorities.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <TrendingUp size={18} color="var(--primary)" />
                  <span>Optimal Learning Sequence</span>
                </div>
              </div>
              <div className="grid-3" style={{ gap: '14px' }}>
                {analysis.recommended_priorities.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
                      #{p.rank || idx + 1}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>
                      {p.skill}
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {p.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
