import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';
import { recordLoginAttempt } from '../lib/metrics.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function loginRoute(req, res) {
  const { username, password } = req.body;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  if (!username || !password) {
    recordLoginAttempt(false);
    logger.warn({ ip, username }, 'Login fallido: credenciales incompletas');
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (username !== 'admin' || password !== adminPassword) {
    recordLoginAttempt(false);
    logger.warn({ ip, username }, 'Login fallido: credenciales inválidas');
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  recordLoginAttempt(true);
  logger.info({ ip, username }, 'Login exitoso');

  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { username, role: 'admin' } });
}
