import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database.js';
import * as opencode from './opencode-client.js';
import logger from './logger.js';
import { recordAction } from './history.js';

export async function generateLesson(title, prompt, result, sourceType, sourceId) {
  const learnPrompt = `Basado en esta tarea completada, extrae UNA lección aprendida o aprendizaje útil (máximo 3 oraciones) que pueda ser reutilizado en el futuro. 
  
Título: ${title}
Prompt ejecutado: ${prompt}
Resultado: ${result?.substring(0, 2000)}

Devuelve SOLO el texto de la lección, sin prefijos ni formato.`;

  try {
    const session = await opencode.createSession(`Learn: ${title}`);
    const response = await opencode.sendMessage(session.id, learnPrompt);
    const lessonText = response?.parts?.[0]?.text?.trim();

    if (!lessonText || lessonText.length < 10) {
      logger.warn({ title }, 'Lección generada muy corta, ignorando');
      return null;
    }

    const tags = extractTags(title, prompt, lessonText);
    const lesson = saveLesson(sourceType, sourceId, title, lessonText, tags);

    logger.info({ lessonId: lesson.id, tags }, 'Lección aprendida guardada');
    return lesson;
  } catch (err) {
    logger.error({ err, title }, 'Error generando lección');
    return null;
  }
}

function extractTags(title, prompt, content) {
  const words = [...title.split(/\s+/), ...prompt.split(/\s+/)];
  const stopWords = new Set(['de', 'la', 'el', 'en', 'un', 'una', 'que', 'con', 'por', 'para', 'del', 'las', 'los', 'se', 'su', 'al', 'como']);
  const tags = [...new Set(
    words
      .map(w => w.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, ''))
      .filter(w => w.length > 3 && !stopWords.has(w))
  )];
  return tags.slice(0, 5).join(',');
}

export function saveLesson(sourceType, sourceId, title, content, tags) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO lessons_learned (id, source_type, source_id, title, content, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, sourceType, sourceId, title, content, tags);
  return db.prepare('SELECT * FROM lessons_learned WHERE id = ?').get(id);
}

export function getLessons(limit = 50, offset = 0, search = null) {
  const db = getDb();
  let sql = 'SELECT * FROM lessons_learned';
  const params = [];

  if (search) {
    sql += ' WHERE content LIKE ? OR title LIKE ? OR tags LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
}

export function getLessonStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM lessons_learned').get();
  const bySource = db.prepare(
    'SELECT source_type, COUNT(*) as count FROM lessons_learned GROUP BY source_type'
  ).all();
  return { total: total.count, bySource };
}

export function deleteLesson(id) {
  const db = getDb();
  const lesson = db.prepare('SELECT * FROM lessons_learned WHERE id = ?').get(id);
  if (!lesson) return null;
  db.prepare('DELETE FROM lessons_learned WHERE id = ?').run(id);
  recordAction('config_change', `Lección eliminada: ${lesson.title}`, { lessonId: id });
  return lesson;
}
