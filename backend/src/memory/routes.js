import { Router } from 'express';
import { authenticate } from '../auth/middleware.js';
import { getLessons, getLessonStats, saveLesson, deleteLesson, generateLesson } from '../lib/memory.js';
import { recordAction } from '../lib/history.js';

const router = Router();

router.get('/lessons', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || null;
  const lessons = getLessons(limit, offset, search);
  res.json(lessons);
});

router.get('/stats', authenticate, (req, res) => {
  res.json(getLessonStats());
});

router.post('/lessons', authenticate, async (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'title y content son requeridos' });
  }
  const lesson = saveLesson('manual', null, title, content, tags || '');
  recordAction('config_change', `Lección manual guardada: ${title}`, { lessonId: lesson.id });
  res.status(201).json(lesson);
});

router.post('/generate', authenticate, async (req, res) => {
  const { title, prompt, result } = req.body;
  if (!title || !prompt || !result) {
    return res.status(400).json({ error: 'title, prompt y result son requeridos' });
  }
  const lesson = await generateLesson(title, prompt, result, 'manual', null);
  if (!lesson) return res.status(500).json({ error: 'No se pudo generar una lección' });
  recordAction('config_change', `Lección generada: ${lesson.title}`, { lessonId: lesson.id });
  res.status(201).json(lesson);
});

router.delete('/lessons/:id', authenticate, (req, res) => {
  const lesson = deleteLesson(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lección no encontrada' });
  res.json({ message: 'Lección eliminada' });
});

export default router;
