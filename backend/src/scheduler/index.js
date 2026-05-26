import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import * as opencode from '../opencode/client.js';
import { sendMessage } from '../telegram/webhook.js';

const jobs = new Map();

export function scheduleTask(taskId, prompt, cronExpression, agent) {
  if (jobs.has(taskId)) {
    unscheduleTask(taskId);
  }

  if (!cron.validate(cronExpression)) {
    console.error(`[Scheduler] Cron inválido para tarea ${taskId}: ${cronExpression}`);
    return;
  }

  const job = cron.schedule(cronExpression, async () => {
    await executeTask(taskId, prompt, agent);
  }, {
    timezone: process.env.TZ || 'America/Argentina/Buenos_Aires',
  });

  jobs.set(taskId, job);

  const nextDates = cronExpression.split(' ').length === 5
    ? cronExpression.split(' ')
    : null;

  const db = getDb();
  db.prepare('UPDATE tasks SET next_run_at = ? WHERE id = ?').run(
    new Date(Date.now() + 60000).toISOString(),
    taskId
  );

  console.log(`[Scheduler] Tarea ${taskId} programada: "${cronExpression}"`);
}

export function unscheduleTask(taskId) {
  const job = jobs.get(taskId);
  if (job) {
    job.stop();
    jobs.delete(taskId);
    console.log(`[Scheduler] Tarea ${taskId} desprogramada`);
  }
}

export function stopAll() {
  for (const [id, job] of jobs) {
    job.stop();
  }
  jobs.clear();
  console.log('[Scheduler] Todas las tareas detenidas');
}

export function loadAllTasks() {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks WHERE enabled = 1').all();
  console.log(`[Scheduler] Cargando ${tasks.length} tareas activas...`);
  for (const task of tasks) {
    scheduleTask(task.id, task.prompt, task.cron_expression, task.agent);
  }
}

async function executeTask(taskId, prompt, agent) {
  const logId = uuidv4();
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!task || !task.enabled) return;

  console.log(`[Scheduler] Ejecutando tarea ${taskId}: "${task.title}"`);

  db.prepare(`
    INSERT INTO task_logs (id, task_id, status, started_at)
    VALUES (?, ?, 'running', datetime('now'))
  `).run(logId, taskId);

  try {
    const session = await opencode.createSession(`Scheduled: ${task.title}`);
    const result = await opencode.sendMessage(session.id, prompt, agent);
    const responseText = result?.parts?.[0]?.text || '';

    db.prepare(`
      UPDATE task_logs SET status = 'success', result = ?, session_id = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(responseText.substring(0, 10000), session.id, logId);

    db.prepare(`
      UPDATE tasks SET last_run_at = datetime('now'), next_run_at = datetime('now', '+1 day') WHERE id = ?
    `).run(taskId);

    const chatId = task.created_by;
    if (chatId && !isNaN(parseInt(chatId))) {
      const summary = responseText.length > 500
        ? responseText.substring(0, 497) + '...'
        : responseText;
      await sendMessage(parseInt(chatId), [
        `*✅ Tarea completada:* ${task.title}`,
        `📅 Programada: \`${task.cron_expression}\``,
        ``,
        summary,
      ].join('\n'));
    }

    console.log(`[Scheduler] Tarea ${taskId} completada exitosamente`);
  } catch (err) {
    console.error(`[Scheduler] Error en tarea ${taskId}:`, err.message);

    db.prepare(`
      UPDATE task_logs SET status = 'failed', error = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(err.message.substring(0, 2000), logId);

    db.prepare('UPDATE tasks SET last_run_at = datetime(\'now\') WHERE id = ?').run(taskId);

    const chatId = task.created_by;
    if (chatId && !isNaN(parseInt(chatId))) {
      await sendMessage(parseInt(chatId),
        `❌ *Error en tarea:* ${task.title}\n\`${err.message.substring(0, 200)}\``
      );
    }
  }
}
