import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getDb, closeDb } from './db/index.js';
import { authenticate, loginRoute } from './api/auth.js';
import tasksRouter from './api/tasks.js';
import proxyRouter from './api/proxy.js';
import { handleUpdate, setWebhook } from './telegram/webhook.js';
import { loadAllTasks, stopAll } from './scheduler/index.js';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '3000');

app.use(cors());
app.use(morgan('short'));

app.post('/telegram/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  res.sendStatus(200);
  await handleUpdate(req.body);
});

app.get('/telegram/set-webhook', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: '?url= requerido' });
    const result = await setWebhook(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', express.json(), loginRoute);

app.use('/api/tasks', express.json(), authenticate, tasksRouter);
app.use('/api/opencode', express.json(), authenticate, proxyRouter);

app.get('/api/health', (req, res) => {
  res.json({ healthy: true, uptime: process.uptime() });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

getDb();
loadAllTasks();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Backend] OpenCode-Omni corriendo en puerto ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[Backend] Cerrando...');
  stopAll();
  closeDb();
  server.close();
});

process.on('SIGINT', () => {
  console.log('[Backend] Cerrando...');
  stopAll();
  closeDb();
  server.close();
  process.exit(0);
});
