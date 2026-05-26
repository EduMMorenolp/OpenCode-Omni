import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ ip: req.ip }, 'Auth fallido: token no proporcionado');
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn({ ip: req.ip }, 'Auth fallido: token inválido o expirado');
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
