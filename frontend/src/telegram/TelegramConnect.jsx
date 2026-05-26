import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function TelegramConnect() {
  const [status, setStatus] = useState('loading');
  const [token, setToken] = useState('');
  const [botInfo, setBotInfo] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    setStatus('loading');
    try {
      const data = await api.settings.telegramStatus();
      setStatus(data.configured ? 'connected' : 'disconnected');
      setBotInfo(data.botUsername ? { username: data.botUsername } : null);
    } catch {
      setStatus('error');
    }
  }

  async function handleConnect(e) {
    e.preventDefault();
    if (!token.trim()) return;
    setSaving(true);
    setError('');
    try {
      const data = await api.settings.telegramUpdate(token.trim());
      setStatus('connected');
      setBotInfo({ username: data.username, name: data.name });
      setToken('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    try {
      const data = await api.settings.telegramTest();
      setBotInfo(data.ok ? { username: data.username, name: data.name } : null);
      setStatus(data.ok ? 'connected' : 'disconnected');
      if (!data.ok) setError(data.detail || 'Error de conexión');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{
      background: 'rgba(30,41,59,0.6)',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: status === 'connected'
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {status === 'connected' ? '✅' : '📡'}
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Conexión Telegram</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0' }}>
            {status === 'connected'
              ? `Conectado como @${botInfo?.username || '...'}`
              : status === 'disconnected'
              ? 'No hay bot configurado'
              : status === 'loading'
              ? 'Verificando...'
              : 'Error de conexión'}
          </p>
        </div>
      </div>

      {status === 'connected' && (
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1rem',
          padding: '0.5rem 0.75rem', background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px',
          fontSize: '0.85rem', color: '#4ade80', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.7rem' }}>●</span>
          Bot activo{botInfo?.name ? ` — ${botInfo.name}` : ''}
          {botInfo?.username ? ` (@${botInfo.username})` : ''}
        </div>
      )}

      <form onSubmit={handleConnect} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder={status === 'connected' ? 'Cambiar token...' : 'Pega el token de BotFather'}
          disabled={saving}
          style={{
            flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #334155',
            borderRadius: '8px', background: '#0f172a', color: '#f1f5f9',
            fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace',
          }}
        />
        <button type="submit" disabled={!token.trim() || saving} style={{
          padding: '0.6rem 1rem',
          background: !token.trim() || saving ? '#1e293b' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: !token.trim() || saving ? '#475569' : '#fff',
          border: 'none', borderRadius: '8px', cursor: !token.trim() || saving ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem', fontWeight: 500,
        }}>
          {saving ? 'Conectando...' : status === 'connected' ? 'Actualizar' : 'Conectar'}
        </button>
      </form>

      {error && (
        <div style={{
          marginTop: '0.75rem', padding: '0.5rem 0.75rem',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      <button onClick={handleTest} style={{
        marginTop: '0.75rem', padding: '0.4rem 0.8rem',
        background: 'transparent', border: '1px solid #334155',
        borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
        fontSize: '0.8rem',
      }}>
        Probar conexión
      </button>
    </div>
  );
}
