import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Trash2,
  AlertCircle,
  Bot,
  User,
  Target,
  ArrowRight,
  MapPin,
  Clock,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AiStatusBanner from '../components/AiStatusBanner';

export default function AssistantPage() {
  const location = useLocation();
  const { user, activeGoal, aiStatus } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const starterPrompts = [
    'Explain the core engineering concepts for my current roadmap task',
    'Why is this skill required for my career goal?',
    'Suggest a hands-on coding practice exercise for this milestone',
    'How do I test and verify the completion criteria for my task?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await api.getAssistantHistory();
        if (res.success && res.history) {
          setMessages(res.history);
        }
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Handle prefilled query passed via React Router location state
  useEffect(() => {
    if (location.state?.prefilledQuery) {
      setInput(location.state.prefilledQuery);
    }
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setError('');

    // Append user message optimistically
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.sendAssistantMessage(userText, location.state?.contextTopic || 'General Learning');
      if (res.success && res.message) {
        setMessages(prev => [...prev, res.message]);
      } else {
        setError(res.message || 'The AI assistant was unable to process your request.');
      }
    } catch (err) {
      setError(err.message || 'Failed to communicate with AI service. Please verify your connection or API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearAssistantHistory();
      setMessages([]);
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <AiStatusBanner />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-primary">
              <Sparkles size={12} /> AI Engineering Mentor
            </span>
            <span className="badge badge-neutral">Context-Aware</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            AI Learning Assistant
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Ask conceptual questions, debug technical challenges, and clarify your roadmap milestones.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}
          >
            <Trash2 size={14} /> Clear Conversation
          </button>
        )}
      </div>

      {/* Context Badge Strip */}
      <div
        style={{
          background: '#f1f5f9',
          border: '1px solid var(--border-light)',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          fontSize: '0.825rem',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Active Context:</span>
        <span className="badge badge-neutral" style={{ background: 'white' }}>
          Goal: {activeGoal?.title || 'General Engineering'}
        </span>
        <span className="badge badge-neutral" style={{ background: 'white' }}>
          Discipline: {user?.branch || 'Engineering'}
        </span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.75rem' }}>
          Model: {aiStatus.model || 'Gemini'}
        </span>
      </div>

      {/* Chat Box Container */}
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '620px',
          background: 'white'
        }}
      >
        {/* Messages Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Welcome Intro Message */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={18} />
            </div>
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxWidth: '85%' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '4px' }}>
                SkillSupport AI Mentor
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Hello {user?.name?.split(' ')[0] || 'there'}! I am your AI learning companion.
                I have full context on your target goal of <strong>"{activeGoal?.title || 'engineering'}"</strong> and your roadmap milestones.
                How can I assist your study today?
              </p>
            </div>
          </div>

          {/* Render Saved Messages */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isUser ? 'var(--primary)' : 'var(--primary-light)',
                    color: isUser ? 'white' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isUser ? <User size={16} /> : <Bot size={18} />}
                </div>

                <div
                  style={{
                    background: isUser ? 'var(--primary-light)' : '#f8fafc',
                    color: isUser ? '#1e1b4b' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: isUser ? '1px solid var(--primary-border)' : '1px solid var(--border-light)',
                    maxWidth: '85%',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} />
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI Mentor is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-banner alert-banner-warning" style={{ margin: '12px 0 6px', padding: '8px 12px' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.8rem' }}>{error}</span>
          </div>
        )}

        {/* Starter Prompts */}
        {messages.length < 3 && (
          <div style={{ margin: '12px 0 6px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(prompt)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#f8fafc', whiteSpace: 'nowrap' }}
              >
                + {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <input
            type="text"
            className="form-input"
            placeholder={aiStatus.configured ? "Ask a question about your roadmap or learning concepts..." : "Gemini API key is required in server/.env to chat with AI"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !aiStatus.configured}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !aiStatus.configured}
            className="btn btn-primary"
            style={{ padding: '0 20px' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
