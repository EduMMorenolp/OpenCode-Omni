import { EventEmitter } from 'events';
import { getDb } from './database.js';
import logger from './logger.js';

const EVENT_TYPES = [
  'task.completed',
  'task.failed',
  'health.changed',
  'login.failed',
  'telegram.command',
];

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

async function fireHook(hook, payload) {
  try {
    const config = typeof hook.action_config === 'string'
      ? JSON.parse(hook.action_config)
      : hook.action_config;

    if (hook.action_type === 'telegram_message') {
      const { default: sendMessage } = await import('../telegram/webhook.js');
      const chatId = config.chat_id || process.env.ADMIN_CHAT_ID;
      if (chatId) {
        const msg = config.template
          ? config.template.replace(/\{(\w+)\}/g, (_, k) => payload[k] || '')
          : payload.description || 'Evento disparado';
        await sendMessage(parseInt(chatId), msg).catch(err =>
          logger.error({ err, hookId: hook.id }, 'Hook telegram fallido')
        );
      }
    }

    if (hook.action_type === 'webhook') {
      const url = config.url;
      if (url) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: hook.event_type, ...payload }),
        }).catch(err =>
          logger.error({ err, hookId: hook.id, url }, 'Hook webhook fallido')
        );
      }
    }
  } catch (err) {
    logger.error({ err, hookId: hook.id }, 'Hook error');
  }
}

export function emitEvent(eventType, payload) {
  if (!EVENT_TYPES.includes(eventType)) {
    logger.warn({ eventType }, 'Tipo de evento no registrado');
    return;
  }

  try {
    const db = getDb();
    const hooks = db.prepare(
      'SELECT * FROM hooks WHERE event_type = ? AND enabled = 1'
    ).all(eventType);

    for (const hook of hooks) {
      fireHook(hook, payload);
    }
  } catch (err) {
    logger.error({ err, eventType }, 'Error emitiendo evento');
  }

  emitter.emit(eventType, payload);
}

export function onEvent(eventType, listener) {
  if (!EVENT_TYPES.includes(eventType)) {
    logger.warn({ eventType }, 'Tipo de evento no registrado para listener');
    return;
  }
  emitter.on(eventType, listener);
}

export function getHookListeners(eventType) {
  return emitter.listeners(eventType);
}

export { EVENT_TYPES };
