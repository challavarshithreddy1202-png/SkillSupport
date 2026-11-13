import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Map,
  SplitSquareVertical,
  BookOpen,
  TrendingUp,
  Sparkles,
  User,
  LogOut,
  Menu,
  X,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, activeGoal, logout, aiStatus } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to={user ? "/dashboard" : "/"} className="brand-link">
          <div className="brand-icon">
            <Compass size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div>SkillSupport</div>
            <div className="brand-tagline">Plan. Learn. Grow.</div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {user ? (
          <ul className="nav-links" style={{ display: 'flex' }}>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/roadmap" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Map size={18} />
                <span>My Roadmap</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/skill-gap" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <SplitSquareVertical size={18} />
                <span>Skill Gap</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/resources" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BookOpen size={18} />
                <span>Resources</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/progress" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <TrendingUp size={18} />
                <span>Progress</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/assistant" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Sparkles size={18} color="#4f46e5" />
                <span>AI Assistant</span>
              </NavLink>
            </li>
          </ul>
        ) : null}

        {/* Right Side Actions */}
        <div className="nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Show setup alert only when API key is not configured */}
              {!aiStatus.configured && (
                <div
                  className="badge badge-warning"
                  title="AI key not set in server/.env"
                  style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => navigate('/settings')}
                >
                  <Cpu size={13} />
                  <span>AI Setup Needed</span>
                </div>
              )}

              {/* User Profile Shortcut */}
              <Link
                to="/settings"
                className="btn btn-secondary btn-sm"
                title={`${user.name} (${user.branch})`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <User size={15} />
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0]}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Log out"
                style={{ padding: '6px 10px', color: 'var(--text-muted)' }}
              >
                <LogOut size={16} />
              </button>

              {/* Mobile Menu Button */}
              <button
                className="btn btn-secondary btn-sm mobile-only"
                style={{ display: 'none' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && user && (
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid var(--border-light)',
          padding: '12px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="nav-item">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/roadmap" onClick={() => setMobileMenuOpen(false)} className="nav-item">
            <Map size={18} /> My Roadmap
          </Link>
          <Link to="/skill-gap" onClick={() => setMobileMenuOpen(false)} className="nav-item">
            <SplitSquareVertical size={18} /> Skill Gap
          </Link>
          <Link to="/resources" onClick={() => setMobileMenuOpen(false)} className="nav-item">
            <BookOpen size={18} /> Resources
          </Link>
          <Link to="/progress" onClick={() => setMobileMenuOpen(false)} className="nav-item">
            <TrendingUp size={18} /> Progress
          </Link>
          <Link to="/assistant" onClick={() => setMobileMenuOpen(false)} className="nav-item">
            <Sparkles size={18} /> AI Assistant
          </Link>
          <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="nav-item">
            <User size={18} /> Profile & Settings
          </Link>
        </div>
      )}
    </nav>
  );
}
