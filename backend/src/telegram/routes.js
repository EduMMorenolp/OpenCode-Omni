import { Router } from 'express';
import { handleUpdate, setWebhook } from './webhook.js';

const router = Router();

router.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  await handleUpdate(req.body);
});

router.get('/set-webhook', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: '?url= requerido' });
    const result = await setWebhook(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
