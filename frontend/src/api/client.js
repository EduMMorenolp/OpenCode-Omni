const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    getConfig() {
      return request('/api/opencode/config');
    },
  },
};
