import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/database.js';
import * as opencode from '../lib/opencode-client.js';
import { sendImageMessage } from '../lib/opencode-client.js';
import { scheduleTask, unscheduleTask } from '../scheduler/index.js';
import logger from '../lib/logger.js';
import { recordAction } from '../lib/history.js';
import { emitEvent } from '../lib/events.js';
import { getLessons, saveLesson } from '../lib/memory.js';
import { downloadTelegramPhoto } from '../lib/file-utils.js';

const TELEGRAM_API = 'https://api.telegram.org/bot';

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado');
  return token;
}

async function sendMessage(chatId, text, extra = {}) {
  const token = getBotToken();
  const url = `${TELEGRAM_API}${token}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: 'Markdown', ...extra };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function setWebhook(url) {
  const token = getBotToken();
  const apiUrl = `${TELEGRAM_API}${token}/setWebhook`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return response.json();
}

async function deleteWebhook() {
  const token = getBotToken();
  const apiUrl = `${TELEGRAM_API}${token}/deleteWebhook`;
  const response = await fetch(apiUrl, { method: 'POST' });
  return response.json();
}

function parseCommand(text) {
  if (!text) return null;
  const parts = text.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  return { command, args, fullText: text.trim() };
}

async function handleStart(chatId) {
  const msg = [
    '*🤖 OpenCode-Omni Bot*',
    '',
    'Controla OpenCode y programa tareas desde Telegram.',
    '',
    '*Comandos:*',
    '`/task <prompt> | <cron>` — Crear tarea programada',
    '`/tasks` — Listar tareas activas',
    '`/cancel <id>` — Deshabilitar tarea',
    '`/delete <id>` — Eliminar tarea',
    '`/status` — Estado del sistema',
    '`/shell <cmd>` — Ejecutar comando shell',
    '`/session <prompt>` — Chat directo con OpenCode',
    '',
    '`/learn <búsqueda>` — Consultar lecciones aprendidas',
    '',
    '*Ejemplo:*',
    '`/task Scrapear precios de Amazon | 0 9 * * *`',
  ].join('\n');
  await sendMessage(chatId, msg);
}

async function handleTask(chatId, args) {
  const fullText = args.join(' ');
  const separator = fullText.lastIndexOf('|');
  if (separator === -1) {
    return sendMessage(chatId,
      'Formato: `/task <prompt> | <cron>`\nEj: `/task Scrapear Amazon | 0 9 * * *`'
    );
  }

  const prompt = fullText.substring(0, separator).trim();
  const cronExpr = fullText.substring(separator + 1).trim();

  if (!prompt || !cronExpr) {
    return sendMessage(chatId, 'Prompt y expresión cron son requeridos.');
  }

  const parts = cronExpr.split(/\s+/);
  if (parts.length !== 5) {
    return sendMessage(chatId,
      'Cron inválido. Debe tener 5 campos: `minuto hora día-día mes día-semana`\nEj: `0 9 * * *` = cada día a las 9AM'
    );
  }

  const title = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
  const id = uuidv4();
  const db = getDb();

  db.prepare(`
    INSERT INTO tasks (id, title, prompt, cron_expression, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title, prompt, cronExpr, String(chatId));

  scheduleTask(id, prompt, cronExpr);

  await sendMessage(chatId,
    `*✅ Tarea creada*`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 Ver tareas', callback_data: 'list_tasks' },
          { text: '❌ Cancelar', callback_data: `cancel_${id}` }
        ]]
      }
    }
  );
}

async function handleListTasks(chatId) {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();

  if (tasks.length === 0) {
    return sendMessage(chatId, 'No hay tareas programadas.');
  }

  const lines = tasks.map((t, i) => {
    const status = t.enabled ? '🟢' : '🔴';
    const cron = t.cron_expression;
    const lastRun = t.last_run_at || '—';
    return `${i + 1}. ${status} \`${t.id.substring(0, 8)}\` — *${t.title}*\n   ⏰ \`${cron}\` — Última: ${lastRun}`;
  });

  const msg = `*📋 Tareas (${tasks.length})*\n\n${lines.join('\n\n')}`;
  await sendMessage(chatId, msg);
}

async function handleCancel(chatId, args) {
  if (args.length === 0) return sendMessage(chatId, 'Usa: `/cancel <id>`');

  const taskId = args[0];
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id LIKE ?').get(`%${taskId}%`);
  if (!task) return sendMessage(chatId, 'Tarea no encontrada.');

  db.prepare('UPDATE tasks SET enabled = 0 WHERE id = ?').run(task.id);
  unscheduleTask(task.id);

  await sendMessage(chatId, `🔴 Tarea deshabilitada: *${task.title}*`);
}

async function handleDelete(chatId, args) {
  if (args.length === 0) return sendMessage(chatId, 'Usa: `/delete <id>`');

  const taskId = args[0];
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id LIKE ?').get(`%${taskId}%`);
  if (!task) return sendMessage(chatId, 'Tarea no encontrada.');

  unscheduleTask(task.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);

  await sendMessage(chatId, `🗑️ Tarea eliminada: *${task.title}*`);
}

async function handleStatus(chatId) {
  let ocStatus = '❌ No disponible';
  try {
    const h = await opencode.health();
    ocStatus = h.healthy ? '✅ Saludable' : '⚠️ Reporta no saludable';
  } catch (e) {
    ocStatus = `❌ Error: ${e.message}`;
  }

  const db = getDb();
  const activeTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE enabled = 1').get();
  const recentLogs = db.prepare(
    'SELECT tl.*, t.title FROM task_logs tl JOIN tasks t ON t.id = tl.task_id ORDER BY tl.created_at DESC LIMIT 5'
  ).all();

  const lines = [
    `*📊 Estado del Sistema*`,
    ``,
    `*OpenCode Core:* ${ocStatus}`,
    `*Tareas activas:* ${activeTasks.count}`,
    `*Últimas ejecuciones:*`,
  ];

  if (recentLogs.length === 0) {
    lines.push('  — Sin ejecuciones recientes');
  } else {
    for (const log of recentLogs) {
      const icon = log.status === 'success' ? '✅' : log.status === 'failed' ? '❌' : '⏳';
      lines.push(`  ${icon} ${log.title} — ${log.completed_at || log.started_at || log.created_at}`);
    }
  }

  await sendMessage(chatId, lines.join('\n'));
}

async function handleShell(chatId, args) {
  if (args.length === 0) return sendMessage(chatId, 'Usa: `/shell <comando>`');

  const command = args.join(' ');
  await sendMessage(chatId, `⚙️ Ejecutando: \`${command}\``);

  try {
    const session = await opencode.createSession('Shell: ' + command.substring(0, 30));
    const result = await opencode.executeShell(session.id, command);
    await opencode.deleteSession(session.id);

    const text = result?.parts?.[0]?.text || 'Comando ejecutado (sin salida)';
    const truncated = text.length > 4000 ? text.substring(0, 3997) + '...' : text;
    await sendMessage(chatId, `*✅ Resultado:*\n\`\`\`\n${truncated}\n\`\`\``);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${err.message}`);
  }
}

async function handleSession(chatId, args) {
  if (args.length === 0) return sendMessage(chatId, 'Usa: `/session <prompt>`');

  const prompt = args.join(' ');
  await sendMessage(chatId, `🤖 Procesando...`);

  try {
    const session = await opencode.createSession('Telegram: ' + prompt.substring(0, 30));
    const result = await opencode.sendMessage(session.id, prompt);

    const text = result?.parts?.[0]?.text || 'Sin respuesta';
    const truncated = text.length > 4000 ? text.substring(0, 3997) + '...' : text;
    await sendMessage(chatId, `*🤖 Respuesta:*\n${truncated}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${err.message}`);
  }
}

async function handleLearn(chatId, args) {
  const query = args.join(' ');
  const lessons = getLessons(10, 0, query || null);

  if (lessons.length === 0) {
    return sendMessage(chatId, query
      ? `No encontré lecciones que coincidan con: "${query}"`
      : 'No hay lecciones aprendidas guardadas.\n\nLas lecciones se generan automáticamente al completar tareas programadas.');
  }

  const lines = lessons.map((l, i) =>
    `${i + 1}. *${l.title}*\n   ${l.content.substring(0, 300)}\n   🏷️ ${l.tags || '—'}`
  );
  const msg = `*🧠 Lecciones Aprendidas (${lessons.length})*\n\n${lines.join('\n\n')}`;
  await sendMessage(chatId, msg);
}

async function handlePhoto(chatId, photo, caption) {
  try {
    const fileId = photo[photo.length - 1].file_id;
    await sendMessage(chatId, '📷 Recibí tu imagen. Analizando...');

    const { buffer, mimeType } = await downloadTelegramPhoto(fileId);
    const base64 = buffer.toString('base64');

    const session = await opencode.createSession('Telegram photo');
    const prompt = caption || 'Describe esta imagen en detalle.';
    const result = await sendImageMessage(session.id, prompt, base64, mimeType);

    const text = result?.parts?.[0]?.text || 'No pude analizar la imagen.';
    const truncated = text.length > 4000 ? text.substring(0, 3997) + '...' : text;

    await sendMessage(chatId, `*📷 Análisis de imagen:*\n${truncated}`);
  } catch (err) {
    logger.error({ err }, 'Error procesando foto');
    await sendMessage(chatId, `❌ Error analizando imagen: ${err.message}`);
  }
}

async function handleCallbackQuery(chatId, data) {
  if (data === 'list_tasks') return handleListTasks(chatId);
  if (data.startsWith('cancel_')) {
    const taskId = data.replace('cancel_', '');
    return handleCancel(chatId, [taskId]);
  }
}

export async function handleUpdate(update) {
  try {
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const parsed = parseCommand(update.message.text);
      if (!parsed) return;

      const commandName = parsed.command;
      const commandArg = parsed.args.join(' ').substring(0, 100);
      emitEvent('telegram.command', { command: commandName, chatId, args: commandArg });
      recordAction('telegram_command', `/${commandName} desde chat ${chatId}`, {
        command: commandName,
        chatId,
        args: commandArg,
      });

      switch (commandName) {
        case '/start': return handleStart(chatId);
        case '/task': return handleTask(chatId, parsed.args);
        case '/tasks': return handleListTasks(chatId);
        case '/cancel': return handleCancel(chatId, parsed.args);
        case '/delete': return handleDelete(chatId, parsed.args);
        case '/status': return handleStatus(chatId);
        case '/shell': return handleShell(chatId, parsed.args);
        case '/session': return handleSession(chatId, parsed.args);
        case '/learn': return handleLearn(chatId, parsed.args);
        default: return sendMessage(chatId, `Comando no reconocido: ${parsed.command}. Usa /start`);
      }
    }

    if (update.message?.photo) {
      const chatId = update.message.chat.id;
      const caption = update.message.caption || '';
      recordAction('telegram_command', `/photo desde chat ${chatId}`, { chatId });
      await handlePhoto(chatId, update.message.photo, caption);
      return;
    }

    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;
      await handleCallbackQuery(chatId, data);
    }
  } catch (err) {
    logger.error({ err }, 'Error procesando update de Telegram');
  }
}

export { setWebhook, deleteWebhook, sendMessage };
