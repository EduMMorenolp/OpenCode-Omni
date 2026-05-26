const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3021';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (options.headers && !options.headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  login(username, password) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  health() {
    return request('/api/health');
  },

  tasks: {
    list() {
      return request('/api/tasks');
    },
    get(id) {
      return request(`/api/tasks/${id}`);
    },
    create(data) {
      return request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return request(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete(id) {
      return request(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    },
    logs(id) {
      return request(`/api/tasks/${id}/logs`);
    },
  },

  history: {
    actions(limit = 50, type = null) {
      let url = `/api/history/actions?limit=${limit}`;
      if (type) url += `&type=${type}`;
      return request(url);
    },
    stats() { return request('/api/history/stats'); },
    types() { return request('/api/history/types'); },
  },

  vision: {
    analyze(file, prompt = '') {
      const formData = new FormData();
      formData.append('file', file);
      if (prompt) formData.append('prompt', prompt);
      return request('/api/vision/analyze', {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
  },

  memory: {
    lessons(search = '') {
      let url = '/api/memory/lessons?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return request(url);
    },
    stats() { return request('/api/memory/stats'); },
    create(data) {
      return request('/api/memory/lessons', { method: 'POST', body: JSON.stringify(data) });
    },
    generate(data) {
      return request('/api/memory/generate', { method: 'POST', body: JSON.stringify(data) });
    },
    delete(id) { return request(`/api/memory/lessons/${id}`, { method: 'DELETE' }); },
  },

  hooks: {
    list() { return request('/api/hooks'); },
    create(data) {
      return request('/api/hooks', { method: 'POST', body: JSON.stringify(data) });
    },
    update(id, data) {
      return request(`/api/hooks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete(id) { return request(`/api/hooks/${id}`, { method: 'DELETE' }); },
    events() { return request('/api/hooks/events'); },
  },

  settings: {
    telegramStatus() {
      return request('/api/settings/telegram');
    },
    telegramUpdate(token) {
      return request('/api/settings/telegram', {
        method: 'PUT',
        body: JSON.stringify({ token }),
      });
    },
    telegramTest() {
      return request('/api/settings/telegram/test', { method: 'POST' });
    },
  },

  opencode: {
    health() {
      return request('/api/opencode/health');
    },
    sessions() {
      return request('/api/opencode/sessions');
    },
    createSession(title) {
      return request('/api/opencode/session', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
    },
    getSession(id) {
      return request(`/api/opencode/session/${id}`);
    },
    deleteSession(id) {
      return request(`/api/opencode/session/${id}`, { method: 'DELETE' });
    },
    sendMessage(sessionId, text, agent) {
      return request(`/api/opencode/session/${sessionId}/message`, {
        method: 'POST',
        body: JSON.stringify({ text, agent }),
      });
    },
    getMessages(sessionId, limit = 10) {
      return request(`/api/opencode/session/${sessionId}/messages?limit=${limit}`);
    },
    sendShell(sessionId, command) {
      return request(`/api/opencode/session/${sessionId}/shell`, {
        method: 'POST',
        body: JSON.stringify({ command }),
      });
    },
    sendCommand(sessionId, command, args, agent) {
      const body = { command };
      if (args) body.arguments = args;
      if (agent) body.agent = agent;
      return request(`/api/opencode/session/${sessionId}/command`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    summarizeSession(sessionId) {
      return request(`/api/opencode/session/${sessionId}/summarize`, {
        method: 'POST',
      });
    },
    listCommands() {
      return request('/api/opencode/commands');
    },
    getConfig() {
      return request('/api/opencode/config');
    },
  },
};
