import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../auth/middleware.js';
import { getDb } from '../lib/database.js';
import { EVENT_TYPES } from '../lib/events.js';
import { recordAction } from '../lib/history.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const hooks = db.prepare('SELECT * FROM hooks ORDER BY created_at DESC').all();
  res.json(hooks.map(h => ({ ...h, action_config: JSON.parse(h.action_config || '{}') })));
});

router.post('/', authenticate, (req, res) => {
  const { name, event_type, action_type, action_config } = req.body;

  if (!name || !event_type || !action_type) {
    return res.status(400).json({ error: 'name, event_type y action_type son requeridos' });
  }
  if (!EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ error: `event_type inválido. Válidos: ${EVENT_TYPES.join(', ')}` });
  }
  if (!['telegram_message', 'webhook'].includes(action_type)) {
    return res.status(400).json({ error: 'action_type debe ser telegram_message o webhook' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO hooks (id, name, event_type, action_type, action_config)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, event_type, action_type, JSON.stringify(action_config || {}));

  recordAction('config_change', `Hook creado: ${name} (${event_type} → ${action_type})`, { hookId: id, name, event_type, action_type });
  const hook = db.prepare('SELECT * FROM hooks WHERE id = ?').get(id);
  res.status(201).json({ ...hook, action_config: JSON.parse(hook.action_config || '{}') });
});

router.put('/:id', authenticate, (req, res) => {
  const db = getDb();
  const hook = db.prepare('SELECT * FROM hooks WHERE id = ?').get(req.params.id);
  if (!hook) return res.status(404).json({ error: 'Hook no encontrado' });

  const { name, event_type, action_type, action_config, enabled } = req.body;

  if (event_type && !EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ error: `event_type inválido. Válidos: ${EVENT_TYPES.join(', ')}` });
  }
  if (action_type && !['telegram_message', 'webhook'].includes(action_type)) {
    return res.status(400).json({ error: 'action_type debe ser telegram_message o webhook' });
  }

  db.prepare(`
    UPDATE hooks SET name = ?, event_type = ?, action_type = ?, action_config = ?, enabled = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || hook.name,
    event_type || hook.event_type,
    action_type || hook.action_type,
    JSON.stringify(action_config || JSON.parse(hook.action_config || '{}')),
    enabled !== undefined ? (enabled ? 1 : 0) : hook.enabled,
    req.params.id
  );

  recordAction('config_change', `Hook actualizado: ${hook.name}`, { hookId: req.params.id, name: hook.name });
  const updated = db.prepare('SELECT * FROM hooks WHERE id = ?').get(req.params.id);
  res.json({ ...updated, action_config: JSON.parse(updated.action_config || '{}') });
});

router.delete('/:id', authenticate, (req, res) => {
  const db = getDb();
  const hook = db.prepare('SELECT * FROM hooks WHERE id = ?').get(req.params.id);
  if (!hook) return res.status(404).json({ error: 'Hook no encontrado' });

  db.prepare('DELETE FROM hooks WHERE id = ?').run(req.params.id);
  recordAction('config_change', `Hook eliminado: ${hook.name}`, { hookId: req.params.id, name: hook.name });
  res.json({ message: 'Hook eliminado' });
});

router.get('/events', authenticate, (req, res) => {
  res.json(EVENT_TYPES);
});

export default router;
