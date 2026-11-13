import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Map,
  Activity,
  Award,
  Calendar,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../services/api';

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const res = await api.getProgress();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Fetch progress error:', err);
        setError('Failed to load progress telemetry.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Calculating learning telemetry...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const milestoneProgress = data?.milestoneProgress || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-primary">Telemetry & Tracking</span>
          <span className="badge badge-success">Live SQLite Persistence</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Learning Progress & Metrics
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', marginTop: '4px' }}>
          Real tracking calculated directly from your saved roadmap tasks and student milestone events.
        </p>
      </div>

      {!data?.hasRoadmap ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Map size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No Learning Data Available</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', marginBottom: '18px' }}>
            Generate a personalized roadmap to begin tracking milestone completion and study analytics.
          </p>
          <Link to="/onboarding" className="btn btn-primary">
            Build My Roadmap
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Metrics Strip */}
          <div className="grid-4">
            <div className="card">
              <span className="card-subtitle" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Completion Rate</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {summary.completionPercentage}%
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {summary.completedTasks} of {summary.totalTasks} tasks cleared
              </div>
            </div>

            <div className="card">
              <span className="card-subtitle" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Milestones Cleared</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a' }}>
                  {summary.completedMilestones}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  / {summary.totalMilestones}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Structured phases mastered
              </div>
            </div>

            <div className="card">
              <span className="card-subtitle" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Hours Invested</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7' }}>
                  {summary.completedHours}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  hrs
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Of ~{summary.totalHours} hrs estimated
              </div>
            </div>

            <div className="card">
              <span className="card-subtitle" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Weekly Commitment</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#9333ea' }}>
                  {summary.weeklyTargetHours}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  hrs / wk
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Target timeline: {summary.totalWeeks} weeks
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart: Milestones Completion */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <BarChart3 size={18} color="var(--primary)" />
                <span>Milestone Completion Progress</span>
              </div>
              <span className="badge badge-neutral">Tasks Breakdown</span>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={milestoneProgress}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="title"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => val.length > 20 ? `${val.substring(0, 18)}...` : val}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Completed']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                  />
                  <Bar dataKey="completionPercentage" radius={[6, 6, 0, 0]}>
                    {milestoneProgress.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.completionPercentage === 100 ? '#10b981' : '#4f46e5'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Log Audit Timeline */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Activity size={18} color="var(--primary)" />
                <span>Recent Learning Audit Log</span>
              </div>
              <span className="badge badge-neutral">Persistent Events</span>
            </div>

            {recentActivities.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                No events recorded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: act.action_type === 'TASK_COMPLETED' ? '#10b981' : '#4f46e5'
                        }}
                      />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {act.description}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(act.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
