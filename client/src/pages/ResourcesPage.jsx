import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');

  const resourceTypes = [
    'All',
    'Interactive Course',
    'Documentation',
    'Video Series',
    'Practice Platform',
    'Book / Article',
    'Project Guide'
  ];

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.getResources({
        search: search.trim(),
        type: selectedType,
        skill: selectedSkill
      });
      if (res.success) {
        setResources(res.resources);
        if (res.availableSkills) {
          setAvailableSkills(res.availableSkills);
        }
      }
    } catch (err) {
      console.error('Fetch resources error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedType, selectedSkill]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="badge badge-primary">Curated Engineering Catalog</span>
          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Verified URLs
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Learning Resources & Curriculum
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', marginTop: '4px' }}>
          Real, verified engineering educational material curated from universities and official documentation.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by topic, framework, or skill (e.g., Python, React, Algorithms)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {resourceTypes.map((t) => (
                <option key={t} value={t}>{t === 'All' ? 'All Formats' : t}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <select
              className="form-select"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="All">All Disciplines</option>
              {availableSkills.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Filtering verified resources...</p>
          </div>
        </div>
      ) : resources.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Resources Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Try adjusting your search keywords or resetting your filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '18px' }}>
          {resources.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    {item.skill_name || 'Engineering'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {item.type}
                    </span>
                    {item.is_verified ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ShieldCheck size={11} /> Verified
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {item.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '12px' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Source: {item.source}
                </span>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Open Resource</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
