import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database.js';
import logger from './logger.js';

const ACTION_TYPES = [
  'login',
  'login_failed',
  'task_created',
  'task_completed',
  'task_failed',
  'task_deleted',
  'task_toggled',
  'shell_exec',
  'telegram_command',
  'config_change',
] ;

export function recordAction(type, description, metadata = {}) {
  if (!ACTION_TYPES.includes(type)) {
    logger.warn({ type }, 'Tipo de acción no reconocido');
    return;
  }

  try {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO action_logs (id, type, description, metadata)
      VALUES (?, ?, ?, ?)
    `).run(id, type, description, JSON.stringify(metadata));
    return id;
  } catch (err) {
    logger.error({ err, type }, 'Error registrando acción');
  }
}

export function getRecentActions(limit = 50, offset = 0, typeFilter = null) {
  const db = getDb();
  let sql = 'SELECT * FROM action_logs';
  const params = [];

  if (typeFilter) {
    sql += ' WHERE type = ?';
    params.push(typeFilter);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({ ...r, metadata: JSON.parse(r.metadata || '{}') }));
}

export function getActionStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM action_logs').get();
  const byType = db.prepare(
    'SELECT type, COUNT(*) as count FROM action_logs GROUP BY type ORDER BY count DESC'
  ).all();
  const last24h = db.prepare(
    "SELECT COUNT(*) as count FROM action_logs WHERE created_at >= datetime('now', '-1 day')"
  ).get();
  return {
    total: total.count,
    last24h: last24h.count,
    byType,
  };
}

export { ACTION_TYPES };
