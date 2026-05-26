import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function SessionsView() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [promptInput, setPromptInput] = useState('');
  const [promptSending, setPromptSending] = useState(false);

  async function loadSessions() {
    try {
      setError('');
      const data = await api.opencode.sessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSessions(); }, []);

  async function loadMessages(sessionId) {
    try {
      const msgs = await api.opencode.getMessages(sessionId, 20);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setSelectedSession(sessionId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!promptInput.trim() || !selectedSession) return;
    setPromptSending(true);
    try {
      await api.opencode.sendMessage(selectedSession, promptInput);
      setPromptInput('');
      await loadMessages(selectedSession);
    } catch (err) {
      setError(err.message);
    } finally {
      setPromptSending(false);
    }
  }

  async function handleNewSession() {
    try {
      const session = await api.opencode.createSession('Dashboard: ' + new Date().toLocaleString());
      setSessions(prev => [session, ...prev]);
      setSelectedSession(session.id);
      setMessages([]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!confirm('¿Eliminar esta sesión?')) return;
    try {
      await api.opencode.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const thStyle = {
    textAlign: 'left', padding: '0.75rem 0.5rem', borderBottom: '1px solid #1e293b',
    color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Sesiones de OpenCode</h1>
        <button onClick={handleNewSession} style={{
          padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
        }}>
          + Nueva Sesión
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', padding: '0.75rem', background: '#450a0a', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#64748b' }}>Cargando...</p>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ flex: '0 0 300px' }}>
            {sessions.length === 0 ? (
              <p style={{ color: '#64748b' }}>Sin sesiones activas</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Sesiones</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} style={{
                      cursor: 'pointer',
                      background: selectedSession === s.id ? '#1e293b' : 'transparent',
                    }}>
                      <td style={{ padding: '0.6rem 0.5rem', borderBottom: '1px solid #1e293b', fontSize: '0.85rem' }}
                        onClick={() => loadMessages(s.id)}>
                        <div>{s.title || 'Sin título'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {s.id.substring(0, 12)}...
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', borderBottom: '1px solid #1e293b' }}>
                        <button onClick={() => handleDeleteSession(s.id)} style={{
                          background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem',
                        }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {selectedSession ? (
              <div>
                <div style={{
                  background: '#1e293b', borderRadius: '8px', padding: '1rem',
                  minHeight: '400px', maxHeight: '500px', overflowY: 'auto', marginBottom: '1rem',
                }}>
                  {messages.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                      Sin mensajes. Envía un prompt para empezar.
                    </p>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} style={{
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: msg.info?.role === 'assistant' ? '#0f172a' : '#1e293b',
                        border: '1px solid #334155',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          {msg.info?.role || 'unknown'} {msg.info?.createdAt ? new Date(msg.info.createdAt).toLocaleTimeString() : ''}
                        </div>
                        <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msg.parts?.map((p, j) => {
                            if (p.type === 'text') return <span key={j}>{p.text}</span>;
                            if (p.type === 'tool_use') return <span key={j} style={{ color: '#60a5fa' }}>[Usando: {p.name}]</span>;
                            return <span key={j} style={{ color: '#64748b' }}>[{p.type}]</span>;
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={promptInput}
                    onChange={e => setPromptInput(e.target.value)}
                    placeholder="Escribe un prompt para OpenCode..."
                    disabled={promptSending}
                    style={{
                      flex: 1, padding: '0.75rem', border: '1px solid #334155', borderRadius: '8px',
                      background: '#0f172a', color: '#f1f5f9', fontSize: '0.95rem',
                    }}
                  />
                  <button type="submit" disabled={promptSending} style={{
                    padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
                    opacity: promptSending ? 0.6 : 1,
                  }}>
                    {promptSending ? '...' : 'Enviar'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '400px', color: '#64748b',
              }}>
                Selecciona una sesión de la lista o crea una nueva.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
