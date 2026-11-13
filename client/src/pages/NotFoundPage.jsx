import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 16px' }}>
      <Compass size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        The learning page or resource you requested could not be located.
      </p>
      <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} /> Return to SkillSupport Home
      </Link>
    </div>
  );
}
