import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Wrench,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AiStatusBanner from '../components/AiStatusBanner';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, refreshUser, aiStatus } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Goal
  const [goalTitle, setGoalTitle] = useState('Full-Stack Web Development');
  const [goalDescription, setGoalDescription] = useState('');

  // Step 2: Current Skills
  const [skillsList, setSkillsList] = useState([
    { name: 'Python', category: 'Programming', proficiency: 'Intermediate' },
    { name: 'HTML & CSS', category: 'Frontend', proficiency: 'Beginner' }
  ]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('Beginner');
  const [experienceSummary, setExperienceSummary] = useState('');

  // Step 3: Preferences
  const [availableHours, setAvailableHours] = useState(profile?.available_hours_per_week || 8);
  const [learningPace, setLearningPace] = useState(profile?.learning_pace || 'Balanced');
  const [learningStyle, setLearningStyle] = useState('Hands-on Projects & Docs');

  const popularGoalIdeas = [
    { branch: 'AI & ML', title: 'Machine Learning & Deep Learning Specialist' },
    { branch: 'AI & ML', title: 'Computer Vision & NLP Applications' },
    { branch: 'I&OT', title: 'Embedded Systems & IoT Firmware (ESP32/FreeRTOS)' },
    { branch: 'I&OT', title: 'Smart Connected Hardware & Sensor Networks' },
    { branch: 'Cybersecurity', title: 'Network Security & Penetration Testing' },
    { branch: 'Cybersecurity', title: 'Web Application Security & SOC Analyst' },
    { branch: 'Mechanical', title: 'CAD Modeling & Finite Element Analysis (FEA)' },
    { branch: 'Mechanical', title: 'Robotics, Mechatronics & Automation' },
    { branch: 'Civil', title: 'Structural Analysis & BIM Design (Revit/ETABS)' },
    { branch: 'Civil', title: 'Smart Infrastructure & Geotechnical Engineering' },
    { branch: 'Software', title: 'Full-Stack Web Development & Cloud APIs' }
  ];

  const suggestedBranchSkills = [
    { branch: 'AI & ML', skills: ['Python', 'PyTorch', 'Scikit-Learn', 'OpenCV', 'Pandas', 'Linear Algebra'] },
    { branch: 'I&OT', skills: ['C/C++', 'Embedded C', 'ESP32', 'Arduino', 'MQTT', 'FreeRTOS', 'Circuit Design'] },
    { branch: 'Cybersecurity', skills: ['Linux Shell', 'Wireshark', 'Nmap', 'Cryptography', 'OWASP Top 10', 'Python'] },
    { branch: 'Mechanical', skills: ['AutoCAD', 'SolidWorks', 'Fusion 360', 'Ansys FEA', 'Thermodynamics', 'MATLAB'] },
    { branch: 'Civil', skills: ['AutoCAD', 'Revit BIM', 'ETABS', 'Structural Mechanics', 'STAAD.Pro', 'QGIS'] }
  ];

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkillsList([
      ...skillsList,
      { name: newSkillName.trim(), category: 'Technical', proficiency: newSkillProficiency }
    ]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (index) => {
    setSkillsList(skillsList.filter((_, idx) => idx !== index));
  };

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Save Goal
      await api.createGoal({
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        category: 'Engineering Development'
      });

      // 2. Sync Profile Preferences & Experience
      await api.updateProfile({
        available_hours_per_week: Number(availableHours),
        learning_pace: learningPace,
        preferred_learning_style: learningStyle,
        experience_summary: experienceSummary.trim()
      });

      // 3. Sync User Skills
      await api.syncSkills(skillsList);

      // 4. Synthesize complete roadmap and skill-gap diagnostic
      await Promise.allSettled([
        api.generateRoadmap(),
        api.generateSkillGap()
      ]);

      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      console.error('Roadmap generation failed:', err);
      setError(err.message || 'Could not generate roadmap. Please check your network or AI configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '24px auto', padding: '0 16px' }}>
      <AiStatusBanner />

      {/* Progress Bar Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Step {currentStep} of 4
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {currentStep === 1 && 'Target Goal'}
            {currentStep === 2 && 'Current Knowledge'}
            {currentStep === 3 && 'Schedule & Pace'}
            {currentStep === 4 && 'Roadmap Synthesis'}
          </span>
        </div>
        <div className="progress-track" style={{ height: '6px' }}>
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        {error && (
          <div className="alert-banner alert-banner-warning" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: GOAL */}
        {currentStep === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Target size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>What is your learning goal?</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
              Enter what you want to achieve or specialize in. The AI will interpret your goal and adapt your curriculum.
            </p>

            <div className="form-group">
              <label className="form-label">Target Goal or Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Become a Machine Learning Engineer or Learn Full-Stack Web Development"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Engineering Goal Ideas by Specialization:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {popularGoalIdeas.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGoalTitle(idea.title)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: goalTitle === idea.title ? 'var(--primary-light)' : 'white',
                      borderColor: goalTitle === idea.title ? 'var(--primary)' : 'var(--border-light)',
                      color: goalTitle === idea.title ? 'var(--primary)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                      {idea.branch}
                    </span>
                    <span>{idea.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Context (Optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Any specific tools, semester projects, or upcoming job interviews in mind?"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!goalTitle.trim()}
                className="btn btn-primary"
              >
                <span>Next: Current Skills</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CURRENT SKILLS */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Wrench size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Your Current Skills & Experience</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
              What tools or programming languages do you already know? This prevents the AI from generating redundant beginner lessons.
            </p>

            {/* Existing Skills List */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Added Skills ({skillsList.length})</label>
              {skillsList.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No skills added yet. Add at least one or proceed as a complete beginner.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skillsList.map((skill, idx) => (
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
                      <span style={{ fontWeight: 600 }}>{skill.name}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                        {skill.proficiency}
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
              )}
            </div>

            {/* Add Skill Row */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                Add a Skill or Tool:
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. C++, Java, React, SQL, Git..."
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
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {/* Branch-Specific Quick Skill Suggestions */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Quick Add by Specialization:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestedBranchSkills.map((bs, bIdx) => (
                    <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {bs.branch}
                      </span>
                      {bs.skills.map((skillName, sIdx) => {
                        const isAlreadyAdded = skillsList.some(s => s.name.toLowerCase() === skillName.toLowerCase());
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            disabled={isAlreadyAdded}
                            onClick={() => {
                              if (!isAlreadyAdded) {
                                setSkillsList([
                                  ...skillsList,
                                  { name: skillName, category: bs.branch, proficiency: 'Beginner' }
                                ]);
                              }
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.725rem',
                              padding: '2px 8px',
                              opacity: isAlreadyAdded ? 0.45 : 1
                            }}
                          >
                            + {skillName} {isAlreadyAdded && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience Summary */}
            <div className="form-group">
              <label className="form-label">Past Project Experience (Optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="e.g. Built a basic college weather app in Python, took a semester course in Data Structures..."
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary"
              >
                <span>Next: Schedule & Pace</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SCHEDULE & PACE */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Clock size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Study Time & Learning Pace</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              The AI calculates task durations based on your actual available time so your roadmap remains realistic.
            </p>

            {/* Hours Slider */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Available Hours Per Week</label>
                <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                  {availableHours} hours / week
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>4 hrs (Casual)</span>
                <span>8–12 hrs (Standard College)</span>
                <span>24 hrs (Full Immersion)</span>
              </div>
            </div>

            {/* Pace Selector */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Preferred Learning Pace</label>
              <div className="grid-3" style={{ gap: '12px' }}>
                {[
                  { id: 'Relaxed', title: 'Relaxed', desc: 'More practice time and gentler milestone ramp-up.' },
                  { id: 'Balanced', title: 'Balanced', desc: 'Steady weekly progress aligned with semester coursework.' },
                  { id: 'Intensive', title: 'Intensive', desc: 'Accelerated high-yield tasks for ambitious sprints.' }
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setLearningPace(p.id)}
                    style={{
                      border: `2px solid ${learningPace === p.id ? 'var(--primary)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      cursor: 'pointer',
                      background: learningPace === p.id ? 'var(--primary-light)' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: learningPace === p.id ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {p.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="btn btn-primary"
              >
                <span>Review & Synthesize</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SYNTHESIZE */}
        {currentStep === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: '#fae8ff', color: '#a21caf', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Sparkles size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Confirm & Generate Roadmap</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
              Review your details below. SkillSupport will employ genuine Gemini AI analysis to construct your personalized roadmap.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Goal</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{goalTitle}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Skills ({skillsList.length})</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {skillsList.length > 0 ? (
                    skillsList.map((s, idx) => (
                      <span key={idx} className="badge badge-neutral">{s.name} ({s.proficiency})</span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starting from basics</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Commitment</span>
                  <div style={{ fontWeight: 600 }}>{availableHours} hours / week</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pace</span>
                  <div style={{ fontWeight: 600 }}>{learningPace}</div>
                </div>
              </div>
            </div>

            {loading && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 12px' }} />
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Synthesizing Your Comprehensive Engineering Roadmap
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
                  Structuring 4 full milestones with 14–16 hands-on coding tasks, verified resources, and practical projects.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={loading}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Synthesizing Course...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate My Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
