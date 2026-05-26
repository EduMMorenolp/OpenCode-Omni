import { writeFile, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = join(__dirname, '..', '..', 'tmp');

function ensureTmpDir() {
  mkdirSync(TMP_DIR, { recursive: true });
}

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado');
  return token;
}

export async function downloadTelegramPhoto(fileId) {
  const token = getBotToken();
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();

  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error('No se pudo obtener el archivo de Telegram');
  }

  const filePath = fileData.result.file_path;
  const ext = filePath.split('.').pop() || 'jpg';
  const photoRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);

  if (!photoRes.ok) throw new Error('No se pudo descargar la foto');

  const buffer = Buffer.from(await photoRes.arrayBuffer());
  return { buffer, mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, ext };
}

export function saveTempFile(buffer, ext) {
  ensureTmpDir();
  const fileName = `upload_${Date.now()}.${ext}`;
  const filePath = join(TMP_DIR, fileName);
  writeFile(filePath, buffer);
  return filePath;
}

export function cleanupTempFile(filePath) {
  try {
    unlinkSync(filePath);
  } catch {
    // ignore
  }
}

export async function extractTextFromFile(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text?.substring(0, 50000) || '';
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.substring(0, 50000) || '';
  }

  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8').substring(0, 50000);
  }

  throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
}

export function mimeFromExtension(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}
