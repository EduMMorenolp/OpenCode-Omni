import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getDb, closeDb } from './lib/database.js';
import { authenticate } from './auth/middleware.js';
import { loginRoute } from './auth/routes.js';
import tasksRouter from './tasks/routes.js';
import sessionsRouter from './sessions/routes.js';
import telegramRouter from './telegram/routes.js';
import { loadAllTasks, stopAll } from './scheduler/index.js';
import { sendMessage } from './telegram/webhook.js';
import logger from './lib/logger.js';
import {
  getMetrics,
  observeHttpRequest,
  setOpencodeHealth,
} from './lib/metrics.js';
import * as opencode from './lib/opencode-client.js';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '3000');

app.use(cors());
app.use(morgan('short'));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    observeHttpRequest(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
});

app.use('/telegram', express.json({ type: 'application/json' }), telegramRouter);

app.post('/api/auth/login', express.json(), loginRoute);

app.use('/api/tasks', express.json(), authenticate, tasksRouter);
app.use('/api/opencode', express.json(), authenticate, sessionsRouter);

app.get('/api/health', async (req, res) => {
  let ocStatus = 'disconnected';
  try {
    const h = await opencode.health();
    ocStatus = h.healthy ? 'connected' : 'unhealthy';
  } catch {
    ocStatus = 'disconnected';
  }

  const db = getDb();
  const tasks = db.prepare(
    'SELECT COUNT(*) as total, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as active FROM tasks'
  ).get();
  const lastRun = db.prepare(
    "SELECT MAX(created_at) as last FROM task_logs WHERE status = 'success'"
  ).get();
  const mem = process.memoryUsage();

  res.json({
    healthy: ocStatus === 'connected',
    uptime: process.uptime(),
    version: '1.0.0',
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
    },
    tasks: {
      total: tasks.total,
      active: tasks.active,
      lastRun: lastRun?.last || null,
    },
    opencode: { status: ocStatus },
  });
});

app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(await getMetrics());
});

app.use((err, req, res, next) => {
  logger.error({ err }, 'Error interno del servidor');
  res.status(500).json({ error: 'Error interno del servidor' });
});

getDb();
loadAllTasks();

let lastOcHealthy = null;
async function checkOpencode() {
  try {
    const h = await opencode.health();
    const healthy = Boolean(h.healthy);
    setOpencodeHealth(healthy);

    if (lastOcHealthy === null) {
      lastOcHealthy = healthy;
    } else if (healthy !== lastOcHealthy) {
      lastOcHealthy = healthy;
      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (adminChatId) {
        const msg = healthy
          ? '*✅ OpenCode Core recuperado* — El servicio está nuevamente disponible.'
          : '*🚨 OpenCode Core caído* — El servicio no responde. Revisa el contenedor.';
        await sendMessage(parseInt(adminChatId), msg).catch(() => {});
      }
    }
  } catch {
    setOpencodeHealth(false);
    if (lastOcHealthy === null) lastOcHealthy = false;
    else if (lastOcHealthy !== false) {
      lastOcHealthy = false;
      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (adminChatId) {
        await sendMessage(parseInt(adminChatId), '*🚨 OpenCode Core caído* — El servicio no responde. Revisa el contenedor.').catch(() => {});
      }
    }
  }
}

checkOpencode();
setInterval(checkOpencode, 60000);

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, 'Backend iniciado');
});

process.on('SIGTERM', () => {
  logger.info('Cerrando servidor...');
  stopAll();
  closeDb();
  server.close();
});

process.on('SIGINT', () => {
  logger.info('Cerrando servidor...');
  stopAll();
  closeDb();
  server.close();
  process.exit(0);
});
