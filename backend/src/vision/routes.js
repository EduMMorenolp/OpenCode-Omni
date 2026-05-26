import multer from 'multer';
import { Router } from 'express';
import { authenticate } from '../auth/middleware.js';
import { extractTextFromFile, mimeFromExtension, saveTempFile, cleanupTempFile } from '../lib/file-utils.js';
import * as opencode from '../lib/opencode-client.js';
import logger from '../lib/logger.js';
import { recordAction } from '../lib/history.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.post('/analyze', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const mimeType = req.file.mimetype || mimeFromExtension(req.file.originalname);
    const text = await extractTextFromFile(req.file.buffer, mimeType);

    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'No se pudo extraer texto del archivo' });
    }

    const prompt = req.body.prompt
      || `Analiza el siguiente documento y proporciona un resumen conciso:\n\n${text.substring(0, 15000)}`;

    const session = await opencode.createSession(`Doc: ${req.file.originalname}`);
    const result = await opencode.sendMessage(session.id, prompt);
    const responseText = result?.parts?.[0]?.text || 'Sin respuesta';

    recordAction('config_change', `Documento analizado: ${req.file.originalname}`, {
      fileName: req.file.originalname,
      size: req.file.size,
      chars: text.length,
    });

    res.json({
      fileName: req.file.originalname,
      fileSize: req.file.size,
      charsExtracted: text.length,
      response: responseText,
      sessionId: session.id,
    });
  } catch (err) {
    logger.error({ err }, 'Error analizando documento');
    res.status(500).json({ error: err.message });
  }
});

export default router;
