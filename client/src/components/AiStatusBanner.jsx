import React, { useState } from 'react';
import { AlertCircle, X, ExternalLink, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AiStatusBanner() {
  const { aiStatus } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // If AI is configured or user dismissed the alert, don't show
  if (aiStatus.configured || dismissed) {
    return null;
  }

  return (
    <div className="alert-banner alert-banner-warning" style={{ position: 'relative' }}>
      <div style={{ marginTop: '2px', color: '#b45309' }}>
        <Key size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: '2px', color: '#92400e' }}>
          Gemini AI Configuration Notice
        </div>
        <div style={{ color: '#78350f', fontSize: '0.85rem', lineHeight: '1.45' }}>
          Genuine AI roadmap generation, skill-gap analysis, and conversational mentoring require a Google Gemini API key.
          Add <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>GEMINI_API_KEY=your_key</code> in your <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>server/.env</code> file.
          All non-AI features (dashboard, progress tracking, resources, profiles) remain fully accessible.
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#92400e',
              textDecoration: 'underline'
            }}
          >
            Get Free Gemini API Key <ExternalLink size={13} />
          </a>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#b45309',
          cursor: 'pointer',
          padding: '4px'
        }}
        title="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
