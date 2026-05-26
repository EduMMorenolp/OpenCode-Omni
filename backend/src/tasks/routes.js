import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/database.js';
import { scheduleTask, unscheduleTask } from '../scheduler/index.js';
import { recordAction } from '../lib/history.js';

const router = Router();

function parseCronExpr(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return parts.join(' ');
}

router.get('/', (req, res) => {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { title, prompt, cron_expression, agent } = req.body;

  if (!title || !prompt || !cron_expression) {
    return res.status(400).json({ error: 'title, prompt y cron_expression son requeridos' });
  }

  const cron = parseCronExpr(cron_expression);
  if (!cron) {
    return res.status(400).json({ error: 'cron_expression inválida. Debe tener 5 campos separados por espacio' });
  }

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, title, prompt, cron_expression, agent, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title, prompt, cron, agent || 'default', req.user?.username || 'admin');

  scheduleTask(id, prompt, cron, agent || 'default');
  recordAction('task_created', `Tarea creada: ${title}`, { taskId: id, title, cron, agent });

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

  const { title, prompt, cron_expression, agent, enabled } = req.body;
  const cron = cron_expression ? parseCronExpr(cron_expression) : task.cron_expression;
  if (cron_expression && !cron) {
    return res.status(400).json({ error: 'cron_expression inválida' });
  }

  db.prepare(`
    UPDATE tasks SET title = ?, prompt = ?, cron_expression = ?, agent = ?, enabled = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || task.title,
    prompt || task.prompt,
    cron || task.cron_expression,
    agent || task.agent,
    enabled !== undefined ? (enabled ? 1 : 0) : task.enabled,
    req.params.id
  );

  const wasEnabled = task.enabled === 1;
  const newEnabled = enabled !== undefined ? enabled : wasEnabled;
  if (enabled !== undefined && wasEnabled !== newEnabled) {
    recordAction('task_toggled', `Tarea ${newEnabled ? 'habilitada' : 'deshabilitada'}: ${task.title}`, {
      taskId: req.params.id, title: task.title, enabled: newEnabled,
    });
  }

  unscheduleTask(req.params.id);
  if (enabled !== undefined ? enabled : task.enabled) {
    scheduleTask(req.params.id, prompt || task.prompt, cron || task.cron_expression, agent || task.agent);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

  recordAction('task_deleted', `Tarea eliminada: ${task.title}`, { taskId: req.params.id, title: task.title });
  unscheduleTask(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tarea eliminada' });
});

router.get('/:id/logs', (req, res) => {
  const db = getDb();
  const logs = db.prepare(
    'SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.params.id);
  res.json(logs);
});

export default router;
