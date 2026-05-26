import { Router } from 'express';
import * as opencode from '../lib/opencode-client.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const data = await opencode.health();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OpenCode no disponible', detail: err.message });
  }
});

router.post('/session', async (req, res) => {
  try {
    const { title } = req.body;
    const session = await opencode.createSession(title);
    res.status(201).json(session);
  } catch (err) {
    res.status(502).json({ error: 'Error creando sesión', detail: err.message });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await opencode.listSessions();
    res.json(sessions);
  } catch (err) {
    res.status(502).json({ error: 'Error listando sesiones', detail: err.message });
  }
});

router.get('/session/:id', async (req, res) => {
  try {
    const session = await opencode.getSession(req.params.id);
    res.json(session);
  } catch (err) {
    res.status(502).json({ error: 'Error obteniendo sesión', detail: err.message });
  }
});

router.delete('/session/:id', async (req, res) => {
  try {
    const data = await opencode.deleteSession(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Error eliminando sesión', detail: err.message });
  }
});

router.post('/session/:id/message', async (req, res) => {
  try {
    const { text, agent } = req.body;
    if (!text) return res.status(400).json({ error: 'text es requerido' });
    const result = await opencode.sendMessage(req.params.id, text, agent);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Error enviando mensaje', detail: err.message });
  }
});

router.get('/session/:id/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const messages = await opencode.getSessionMessages(req.params.id, limit);
    res.json(messages);
  } catch (err) {
    res.status(502).json({ error: 'Error obteniendo mensajes', detail: err.message });
  }
});

router.post('/session/:id/shell', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'command es requerido' });
    const result = await opencode.executeShell(req.params.id, command);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Error ejecutando comando', detail: err.message });
  }
});

router.get('/config', async (req, res) => {
  try {
    const config = await opencode.getConfig();
    res.json(config);
  } catch (err) {
    res.status(502).json({ error: 'Error obteniendo config', detail: err.message });
  }
});

export default router;
