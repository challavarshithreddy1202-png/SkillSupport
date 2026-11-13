import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Target,
  CheckCircle2,
  BookOpen,
  MapPin,
  TrendingUp,
  Brain,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
        <div
          className="badge badge-primary"
          style={{ marginBottom: '16px', padding: '6px 14px', fontSize: '0.85rem' }}
        >
          <Sparkles size={14} /> AI-Assisted Skill Development for Engineering Students
        </div>

        <h1
          style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '18px'
          }}
        >
          Turn Engineering Ambitions into a <br />
          <span style={{ color: 'var(--primary)' }}>Clear, Achievable Roadmap</span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}
        >
          Define your target career or learning goal. SkillSupport analyzes your current skill set,
          identifies genuine technical gaps, and constructs a structured, week-by-week roadmap tailored to your available time.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="btn btn-primary btn-lg"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Build My Learning Roadmap</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/resources" className="btn btn-secondary btn-lg">
            Explore Verified Resources
          </Link>
        </div>
      </div>

      {/* Roadmap Interactive Preview Card */}
      <div style={{ marginTop: '24px', marginBottom: '64px' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)',
            padding: '28px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Target size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target Engineering Goal
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Full-Stack Web Development & Cloud Systems
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-success">8 Hours / Week</span>
              <span className="badge badge-neutral">Balanced Pace</span>
            </div>
          </div>

          <div className="grid-3" style={{ gap: '16px' }}>
            {/* Step 1 */}
            <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-primary">Milestone 1</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weeks 1–3</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                Modern Web Architecture & REST
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Master asynchronous JavaScript, DOM APIs, and RESTful contract design with Express.
              </p>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--success-text)', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> 4 Tasks • Verified MDN Docs
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-neutral">Milestone 2</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weeks 4–7</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                Full-Stack React & Database Persistence
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Component lifecycles, global state, relational database schema modeling, and SQLite/PostgreSQL.
              </p>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Clock size={14} /> 5 Tasks • Mini Project Included
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-neutral">Milestone 3</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weeks 8–10</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                Production Deployment & Systems
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Containerization with Docker, CI/CD pipelines, authentication security, and performance tuning.
              </p>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Clock size={14} /> 4 Tasks • Capstone Deliverable
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Pillars Section */}
      <div style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
            Built Specifically for Engineering Undergraduates
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            No generic advice or rigid curriculums. Real AI diagnostics tailored to your branch, semester, and schedule.
          </p>
        </div>

        <div className="grid-4">
          <div className="card">
            <div style={{ background: '#e0e7ff', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Target size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Natural Goal Input</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Describe your aspirations naturally — whether it's embedded firmware, machine learning, or web engineering.
            </p>
          </div>

          <div className="card">
            <div style={{ background: '#e0f2fe', color: '#0284c7', width: '40px', height: '40px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Brain size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Skill-Gap Detection</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              AI analyzes your current capabilities, maps prerequisites, and highlights high-yield topics to study first.
            </p>
          </div>

          <div className="card">
            <div style={{ background: '#ecfdf5', color: '#059669', width: '40px', height: '40px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Zap size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Dynamic Roadmap</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Actionable tasks with clear completion criteria, hands-on practice, and verified learning materials.
            </p>
          </div>

          <div className="card">
            <div style={{ background: '#fae8ff', color: '#a21caf', width: '40px', height: '40px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>AI Learning Mentor</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Context-aware assistant ready to explain complex technical concepts, clarify tasks, and review code.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="card" style={{ padding: '36px', marginBottom: '64px', background: 'white' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '32px' }}>
          How SkillSupport Works
        </h2>

        <div className="grid-3" style={{ gap: '28px' }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>01</div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>State Your Ambition</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Share your target role, existing technical skills, self-assessed proficiency, and weekly study budget.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>02</div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>AI Crafts Your Plan</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Google Gemini analyzes skill gaps and generates an ordered milestone timeline with verified resources and mini-projects.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>03</div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Track & Adapt</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Check off tasks, monitor visual progress charts, and use "Improve My Roadmap" whenever your schedule shifts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
          Ready to accelerate your engineering career?
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Join your fellow engineering students and build a purposeful learning trajectory today.
        </p>
        <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
          Start Your Roadmap Now <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
