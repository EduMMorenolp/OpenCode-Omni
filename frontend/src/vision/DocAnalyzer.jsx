import React, { useState, useRef } from 'react';
import { api } from '../api/client';

export default function DocAnalyzer() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.vision.analyze(file, prompt);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const allowedTypes = '.pdf,.docx,.doc,.txt,.md,.csv,.json';

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem' }}>📄 Análisis de Documentos</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Sube un PDF, DOCX o TXT para extraer su contenido y analizarlo con OpenCode.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#3b82f6' : file ? '#22c55e' : '#334155'}`,
          borderRadius: 12,
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(59,130,246,0.08)' : 'transparent',
          transition: 'all 0.2s',
          marginBottom: '1rem',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={allowedTypes}
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files[0])}
        />
        {file ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
            <p style={{ color: '#22c55e', fontWeight: 600 }}>{file.name}</p>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ color: '#94a3b8' }}>
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              PDF, DOCX, TXT, MD, CSV, JSON (máx 50 MB)
            </p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          Prompt personalizado (opcional)
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ej: Resume este documento en 3 puntos clave..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.6rem',
            borderRadius: 8,
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#e2e8f0',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          padding: '0.6rem 1.5rem',
          background: file && !loading ? '#3b82f6' : '#334155',
          color: file && !loading ? '#fff' : '#64748b',
          border: 'none',
          borderRadius: 8,
          cursor: file && !loading ? 'pointer' : 'not-allowed',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
        }}
      >
        {loading ? 'Analizando...' : 'Analizar Documento'}
      </button>

      {error && (
        <div style={{ padding: '1rem', background: '#7f1d1d', borderRadius: 8, marginBottom: '1rem' }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{ background: '#0f172a', borderRadius: 8, padding: '1.2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.4rem 0.8rem', background: '#1e293b', borderRadius: 6, fontSize: '0.85rem' }}>
              📄 {result.fileName}
            </div>
            <div style={{ padding: '0.4rem 0.8rem', background: '#1e293b', borderRadius: 6, fontSize: '0.85rem' }}>
              📝 {result.charsExtracted.toLocaleString()} caracteres extraídos
            </div>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#e2e8f0', fontSize: '0.9rem' }}>
            {result.response}
          </div>
        </div>
      )}
    </div>
  );
}
