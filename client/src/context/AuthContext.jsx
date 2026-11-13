import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeGoal, setActiveGoal] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('skillsupport_token'));
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState({ configured: false, model: '', setupHelp: null });

  // Check system & AI configuration
  const checkAiStatus = async () => {
    try {
      const res = await api.getSystemStatus();
      if (res.success) {
        setAiStatus({
          configured: res.aiConfigured,
          model: res.aiModel,
          setupHelp: res.setupHelp
        });
      }
    } catch (err) {
      console.warn('System status check warning:', err.message);
    }
  };

  // Hydrate user session on mount
  useEffect(() => {
    checkAiStatus();

    const hydrateUser = async () => {
      const storedToken = localStorage.getItem('skillsupport_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setProfile(res.profile);
          setActiveGoal(res.activeGoal);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session hydration failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('skillsupport_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      setActiveGoal(res.activeGoal);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('skillsupport_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('skillsupport_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setActiveGoal(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        setProfile(res.profile);
        setActiveGoal(res.activeGoal);
      }
    } catch (err) {
      console.warn('User refresh error:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeGoal,
        token,
        loading,
        aiStatus,
        login,
        register,
        logout,
        refreshUser,
        checkAiStatus,
        setActiveGoal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
