import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AiStatusBanner from '../components/AiStatusBanner';

export default function ProfileSettingsPage() {
  const { user, profile, refreshUser, aiStatus } = useAuth();

  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [hours, setHours] = useState(8);
  const [pace, setPace] = useState('Balanced');
  const [experienceSummary, setExperienceSummary] = useState('');

  // Skills
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('Beginner');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const branches = [
    'Artificial Intelligence and Machine Learning (AI & ML)',
    'Internet of Things (I&OT)',
    'Cybersecurity',
    'Mechanical Engineering',
    'Civil Engineering',
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Information Technology'
  ];

  const years = [
    '1st Year (Freshman)',
    '2nd Year (Sophomore)',
    '3rd Year (Junior)',
    'Final Year (Senior)'
  ];

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBranch(user.branch || 'Computer Science & Engineering');
      setYearOfStudy(user.year_of_study || '3rd Year');
    }
    if (profile) {
      setHours(profile.available_hours_per_week || 8);
      setPace(profile.learning_pace || 'Balanced');
      setExperienceSummary(profile.experience_summary || '');
    }

    const loadSkills = async () => {
      try {
        const res = await api.getProfile();
        if (res.success && res.skills) {
          setSkills(res.skills);
        }
      } catch (err) {
        console.error('Failed to load profile skills:', err);
      }
    };

    loadSkills();
  }, [user, profile]);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([
      ...skills,
      { name: newSkillName.trim(), category: 'Technical', proficiency: newSkillProficiency }
    ]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, idx) => idx !== index));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.updateProfile({
        name: name.trim(),
        branch,
        year_of_study: yearOfStudy,
        available_hours_per_week: Number(hours),
        learning_pace: pace,
        experience_summary: experienceSummary.trim()
      });

      await api.syncSkills(skills);
      await refreshUser();
      setSuccessMsg('Profile and preferences updated successfully! You can refine your roadmap with AI at any time.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <AiStatusBanner />

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Profile & Learning Preferences
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Manage your engineering background, study hours, and skill portfolio.
        </p>
      </div>

      {successMsg && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-banner alert-banner-warning" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Academic Details Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <GraduationCap size={20} color="var(--primary)" />
              <span>Academic Details</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">College Email (Read Only)</label>
              <input
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Engineering Discipline</label>
              <select
                className="form-select"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select
                className="form-select"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Study Preferences Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="var(--primary)" />
              <span>Learning Commitment & Schedule</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Available Weekly Study Hours</label>
              <span className="badge badge-primary">{hours} hours / week</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <div className="form-helper">
              Changing your hours updates the baseline used when generating or refining future roadmaps.
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Preferred Pace</label>
            <div className="grid-3" style={{ gap: '10px' }}>
              {['Relaxed', 'Balanced', 'Intensive'].map((p) => (
                <div
                  key={p}
                  onClick={() => setPace(p)}
                  style={{
                    border: `2px solid ${pace === p ? 'var(--primary)' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: pace === p ? 'var(--primary-light)' : 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: pace === p ? 'var(--primary)' : 'var(--text-primary)'
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Past Engineering Experience Summary</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              placeholder="Summary of projects, internships, or relevant academic courses..."
            />
          </div>
        </div>

        {/* Skills Portfolio Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Wrench size={20} color="var(--primary)" />
              <span>Current Skills Portfolio ({skills.length})</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {skills.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                  {s.proficiency}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add skill row */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Add skill (e.g. Docker, TypeScript, PyTorch)..."
              style={{ flex: 2, minWidth: '160px' }}
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
            />
            <select
              className="form-select"
              style={{ flex: 1, minWidth: '120px' }}
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <button
              type="button"
              onClick={handleAddSkill}
              className="btn btn-secondary"
            >
              <Plus size={16} /> Add Skill
            </button>
          </div>
        </div>

        {/* Notice on Roadmap Adaptation */}
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', gap: '12px' }}>
          <Sparkles size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <strong>Note on Roadmap Adaptation:</strong> Updating your skills or study hours will not unexpectedly overwrite your current roadmap.
            Whenever you are ready, you can click <strong>"Improve My Roadmap"</strong> on the roadmap screen to let the AI recalculate your timeline while keeping completed tasks safe!
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Profile Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
