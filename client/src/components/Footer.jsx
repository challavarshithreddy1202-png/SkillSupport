import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>SkillSupport</span>
          <span style={{ color: 'var(--text-light)' }}>•</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Plan. Learn. Grow.</span>
        </div>
        <div className="footer-title">
          AI-Assisted Personalized Skill Development and Learning Roadmap System
        </div>
        <div className="footer-subtitle">
          Engineered for engineering students • Persistent SQLite backend • Google Gemini LLM API
        </div>
      </div>
    </footer>
  );
}
