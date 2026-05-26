import axios from 'axios';
import logger from './logger.js';

const OPENCODE_URL = process.env.OPENCODE_URL || 'http://localhost:4096';
const OPENCODE_USER = process.env.OPENCODE_USER || 'opencode';
const OPENCODE_PASSWORD = process.env.OPENCODE_PASSWORD || '';

const client = axios.create({
  baseURL: OPENCODE_URL,
  auth: {
    username: OPENCODE_USER,
    password: OPENCODE_PASSWORD,
  },
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error({
      err: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
    }, 'Error en llamada a OpenCode');
    return Promise.reject(error);
  },
);

export async function health() {
  const { data } = await client.get('/global/health');
  return data;
}

export async function createSession(title) {
  const { data } = await client.post('/session', { title: title || 'Omni Task' });
  return data;
}

export async function sendMessage(sessionId, text, agent) {
  const body = {
    parts: [{ type: 'text', text }],
  };
  if (agent) body.agent = agent;
  const { data } = await client.post(`/session/${sessionId}/message`, body);
  return data;
}

export async function sendMessageAsync(sessionId, text, agent) {
  const body = {
    parts: [{ type: 'text', text }],
  };
  if (agent) body.agent = agent;
  await client.post(`/session/${sessionId}/prompt_async`, body);
}

export async function listSessions() {
  const { data } = await client.get('/session');
  return data;
}

export async function getSession(sessionId) {
  const { data } = await client.get(`/session/${sessionId}`);
  return data;
}

export async function deleteSession(sessionId) {
  const { data } = await client.delete(`/session/${sessionId}`);
  return data;
}

export async function getSessionMessages(sessionId, limit = 10) {
  const { data } = await client.get(`/session/${sessionId}/message`, {
    params: { limit },
  });
  return data;
}

export async function executeShell(sessionId, command) {
  const { data } = await client.post(`/session/${sessionId}/shell`, { command });
  return data;
}

export async function getConfig() {
  const { data } = await client.get('/config');
  return data;
}
