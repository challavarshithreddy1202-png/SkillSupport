// SkillSupport API Client
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || '/api'
).replace(/\/$/, '');

function getHeaders() {
  const token = localStorage.getItem('skillsupport_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.code = data.error;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // System Health & AI Status
  getSystemStatus: () => request('/system/status'),

  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Profile & Skills
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  syncSkills: (skills) => request('/profile/skills', { method: 'PUT', body: JSON.stringify({ skills }) }),

  // Goals
  getGoals: () => request('/goals'),
  createGoal: (payload) => request('/goals', { method: 'POST', body: JSON.stringify(payload) }),

  // Skill-Gap Analysis
  getSkillGap: () => request('/skill-gap'),
  generateSkillGap: () => request('/skill-gap/generate', { method: 'POST' }),

  // Roadmap
  getRoadmap: () => request('/roadmaps'),
  getRoadmapHistory: () => request('/roadmaps/history'),
  getRoadmapById: (id) => request(`/roadmaps/${id}`),
  generateRoadmap: () => request('/roadmaps/generate', { method: 'POST' }),
  startNewRoadmap: (payload) => request('/roadmaps/start-new', { method: 'POST', body: JSON.stringify(payload) }),
  updateTaskStatus: (taskId, is_completed) =>
    request(`/roadmaps/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed })
    }),
  previewRoadmapRefinement: (roadmapId, userFeedback) =>
    request(`/roadmaps/${roadmapId}/refine-preview`, {
      method: 'POST',
      body: JSON.stringify({ userFeedback })
    }),
  applyRoadmapRefinement: (roadmapId, refinedRoadmap) =>
    request(`/roadmaps/${roadmapId}/refine-apply`, {
      method: 'POST',
      body: JSON.stringify({ refinedRoadmap })
    }),

  // Resources
  getResources: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.type) searchParams.append('type', params.type);
    if (params.skill) searchParams.append('skill', params.skill);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/resources${qs}`);
  },

  // Progress
  getProgress: () => request('/progress'),

  // AI Assistant Chat
  getAssistantHistory: () => request('/assistant/history'),
  sendAssistantMessage: (message, context_topic) =>
    request('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context_topic })
    }),
  clearAssistantHistory: () => request('/assistant/history', { method: 'DELETE' })
};

export default api;
