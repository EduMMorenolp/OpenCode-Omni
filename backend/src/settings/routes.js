import { Router } from 'express';
import { getDb } from '../lib/database.js';
import logger from '../lib/logger.js';

const router = Router();

router.get('/telegram', (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
  const hasToken = Boolean(row?.value);
  res.json({
    configured: hasToken,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
    webhookActive: Boolean(process.env.TELEGRAM_WEBHOOK_URL),
  });
});

router.put('/telegram', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const testUrl = `https://api.telegram.org/bot${token}/getMe`;
    const testRes = await fetch(testUrl);
    const testData = await testRes.json();

    if (!testData.ok) {
      return res.status(400).json({ error: 'Token inválido', detail: testData.description });
    }

    const db = getDb();
    db.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES ('telegram_bot_token', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
    ).run(token);

    process.env.TELEGRAM_BOT_TOKEN = token;
    process.env.TELEGRAM_BOT_USERNAME = testData.result?.username || '';

    logger.info({ username: testData.result?.username }, 'Telegram bot token actualizado');

    res.json({
      ok: true,
      username: testData.result?.username,
      name: testData.result?.first_name,
    });
  } catch (err) {
    logger.error({ err }, 'Error actualizando token de Telegram');
    res.status(500).json({ error: err.message });
  }
});

router.post('/telegram/test', async (req, res) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(400).json({ error: 'No hay token configurado' });

    const testRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const testData = await testRes.json();

    res.json({
      ok: testData.ok,
      username: testData.result?.username || null,
      name: testData.result?.first_name || null,
      detail: testData.description || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
