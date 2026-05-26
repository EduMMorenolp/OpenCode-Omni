import { Router } from 'express';
import { authenticate } from '../auth/middleware.js';
import { getRecentActions, getActionStats, ACTION_TYPES } from '../lib/history.js';

const router = Router();

router.get('/actions', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const type = req.query.type || null;

  if (type && !ACTION_TYPES.includes(type)) {
    return res.status(400).json({ error: `Tipo inválido. Válidos: ${ACTION_TYPES.join(', ')}` });
  }

  const actions = getRecentActions(limit, offset, type);
  res.json(actions);
});

router.get('/stats', authenticate, (req, res) => {
  const stats = getActionStats();
  res.json(stats);
});

router.get('/types', authenticate, (req, res) => {
  res.json(ACTION_TYPES);
});

export default router;
