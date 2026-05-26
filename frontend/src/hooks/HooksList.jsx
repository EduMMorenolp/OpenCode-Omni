import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const EVENT_LABELS = {
  'task.completed': '✅ Tarea completada',
  'task.failed': '❌ Tarea fallida',
  'health.changed': '🩺 Salud del sistema',
  'login.failed': '🚫 Login fallido',
  'telegram.command': '📱 Comando Telegram',
};

const ACTION_LABELS = {
  telegram_message: '📨 Mensaje Telegram',
  webhook: '🌐 Webhook',
};

export default function HooksList() {
  const [hooks, setHooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', event_type: '', action_type: 'telegram_message', action_config: {} });

  async function load() {
    try {
      setError('');
      const [hooksData, eventsData] = await Promise.all([
        api.hooks.list(),
        api.hooks.events(),
      ]);
      setHooks(hooksData);
      setEvents(eventsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.hooks.create(form);
      setShowForm(false);
      setForm({ name: '', event_type: '', action_type: 'telegram_message', action_config: {} });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleHook(hook) {
    try {
      await api.hooks.update(hook.id, { enabled: !hook.enabled });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteHook(hookId) {
    if (!confirm('¿Eliminar este hook?')) return;
    try {
      await api.hooks.delete(hookId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const thStyle = {
    textAlign: 'left', padding: '0.75rem 0.5rem', borderBottom: '1px solid #1e293b',
    color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const tdStyle = {
    padding: '0.75rem 0.5rem', borderBottom: '1px solid #1e293b',
    fontSize: '0.9rem', verticalAlign: 'top',
  };
  const inputStyle = {
    width: '100%', padding: '0.6rem', border: '1px solid #334155', borderRadius: '6px',
    background: '#0f172a', color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box',
  };
  const selectStyle = {
    ...inputStyle,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Hooks y Eventos</h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '0.5rem 1rem', background: showForm ? '#1e293b' : '#3b82f6', color: '#fff',
          border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
        }}>
          {showForm ? 'Cancelar' : '+ Nuevo Hook'}
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', padding: '0.75rem', background: '#450a0a', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Nuevo Hook</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Nombre</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Alertar caída" />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Evento</label>
              <select style={selectStyle} value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} required>
                <option value="">Seleccionar...</option>
                {events.map(ev => <option key={ev} value={ev}>{EVENT_LABELS[ev] || ev}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Acción</label>
              <select style={selectStyle} value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })} required>
                <option value="telegram_message">📨 Mensaje Telegram</option>
                <option value="webhook">🌐 Webhook HTTP</option>
              </select>
            </div>
            <div>
              {form.action_type === 'telegram_message' && (
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
                    Chat ID (vacío = ADMIN_CHAT_ID)
                  </label>
                  <input style={inputStyle} value={form.action_config.chat_id || ''}
                    onChange={e => setForm({ ...form, action_config: { ...form.action_config, chat_id: e.target.value } })}
                    placeholder="123456789" />
                </div>
              )}
              {form.action_type === 'webhook' && (
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>URL del Webhook</label>
                  <input style={inputStyle} value={form.action_config.url || ''}
                    onChange={e => setForm({ ...form, action_config: { ...form.action_config, url: e.target.value } })}
                    placeholder="https://..." required />
                </div>
              )}
            </div>
          </div>
          <button type="submit" style={{
            marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem',
          }}>Crear Hook</button>
        </form>
      )}

      {loading ? (
        <p style={{ color: '#64748b' }}>Cargando...</p>
      ) : hooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sin hooks configurados</p>
          <p>Los hooks ejecutan acciones automáticas cuando ocurren eventos del sistema.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Evento</th>
                <th style={thStyle}>Acción</th>
                <th style={thStyle}>Creado</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {hooks.map(h => (
                <tr key={h.id}>
                  <td style={tdStyle}>
                    <button onClick={() => toggleHook(h)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem',
                    }}>{h.enabled ? '🟢' : '🔴'}</button>
                  </td>
                  <td style={tdStyle}><strong>{h.name}</strong></td>
                  <td style={{ ...tdStyle, fontSize: '0.85rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                      background: '#1e293b', color: '#94a3b8',
                    }}>{EVENT_LABELS[h.event_type] || h.event_type}</span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.85rem' }}>{ACTION_LABELS[h.action_type] || h.action_type}</td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem' }}>{h.created_at}</td>
                  <td style={tdStyle}>
                    <button onClick={() => deleteHook(h.id)} style={{
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', padding: 0,
                    }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
