import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';
import { recordLoginAttempt } from '../lib/metrics.js';
import { recordAction } from '../lib/history.js';
import { emitEvent } from '../lib/events.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function loginRoute(req, res) {
  const { username, password } = req.body;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  if (!username || !password) {
    recordLoginAttempt(false);
    logger.warn({ ip, username }, 'Login fallido: credenciales incompletas');
    recordAction('login_failed', `Login incompleto desde ${ip}`, { ip, username });
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (username !== 'admin' || password !== adminPassword) {
    recordLoginAttempt(false);
    logger.warn({ ip, username }, 'Login fallido: credenciales inválidas');
    recordAction('login_failed', `Login fallido desde ${ip}`, { ip, username });
    emitEvent('login.failed', { ip, username });
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  recordLoginAttempt(true);
  logger.info({ ip, username }, 'Login exitoso');
  recordAction('login', `Login exitoso desde ${ip}`, { ip, username });

  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { username, role: 'admin' } });
}
