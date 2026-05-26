import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const TYPE_LABELS = {
  login: '🔐 Login',
  login_failed: '🚫 Login Fallido',
  task_created: '➕ Tarea Creada',
  task_completed: '✅ Tarea Completada',
  task_failed: '❌ Tarea Fallida',
  task_deleted: '🗑️ Tarea Eliminada',
  task_toggled: '🔁 Tarea Alternada',
  shell_exec: '⚡ Shell',
  telegram_command: '📱 Telegram',
  config_change: '⚙️ Config',
};

export default function ActivityLog() {
  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [types, setTypes] = useState([]);

  async function load() {
    try {
      setError('');
      const [actionsData, statsData, typesData] = await Promise.all([
        api.history.actions(100, typeFilter || null),
        api.history.stats(),
        api.history.types(),
      ]);
      setActions(actionsData);
      setStats(statsData);
      setTypes(typesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [typeFilter]);

  const thStyle = {
    textAlign: 'left', padding: '0.6rem 0.5rem', borderBottom: '1px solid #1e293b',
    color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const tdStyle = {
    padding: '0.6rem 0.5rem', borderBottom: '1px solid #1e293b',
    fontSize: '0.85rem', verticalAlign: 'top',
  };
  const selectStyle = {
    padding: '0.4rem 0.75rem', border: '1px solid #334155', borderRadius: '6px',
    background: '#0f172a', color: '#f1f5f9', fontSize: '0.85rem',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Historial de Actividad</h1>
        <select style={selectStyle} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          {types.map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
          ))}
        </select>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '8px', minWidth: '120px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '8px', minWidth: '120px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Últimas 24h</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.last24h}</div>
          </div>
        </div>
      )}

      {error && <p style={{ color: '#ef4444', padding: '0.75rem', background: '#450a0a', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#64748b' }}>Cargando...</p>
      ) : actions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>No hay acciones registradas.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id}>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                      background: a.type === 'login_failed' || a.type === 'task_failed' ? '#450a0a'
                        : a.type === 'login' || a.type === 'task_completed' ? '#064e3b'
                        : '#1e293b',
                      color: a.type === 'login_failed' || a.type === 'task_failed' ? '#fca5a5'
                        : a.type === 'login' || a.type === 'task_completed' ? '#6ee7b7'
                        : '#94a3b8',
                    }}>
                      {TYPE_LABELS[a.type] || a.type}
                    </span>
                  </td>
                  <td style={tdStyle}>{a.description}</td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{a.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
