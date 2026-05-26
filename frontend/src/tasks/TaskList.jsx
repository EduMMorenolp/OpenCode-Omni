import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTasks() {
    try {
      setError('');
      const data = await api.tasks.list();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function toggleTask(task) {
    try {
      await api.tasks.update(task.id, { enabled: !task.enabled });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(taskId) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.tasks.delete(taskId);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  const thStyle = {
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    borderBottom: '1px solid #1e293b',
    color: '#94a3b8',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };
  const tdStyle = {
    padding: '0.75rem 0.5rem',
    borderBottom: '1px solid #1e293b',
    fontSize: '0.9rem',
    verticalAlign: 'top',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Tareas Programadas</h1>
        <Link to="/tasks/new" style={{
          padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff',
          borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem',
        }}>
          + Nueva Tarea
        </Link>
      </div>

      {error && <p style={{ color: '#ef4444', padding: '0.75rem', background: '#450a0a', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#64748b' }}>Cargando...</p>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No hay tareas programadas</p>
          <p>Crea una desde Telegram con `/task` o desde el botón de arriba.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Título</th>
                <th style={thStyle}>Cron</th>
                <th style={thStyle}>Prompt</th>
                <th style={thStyle}>Última ejecución</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={tdStyle}>
                    <button onClick={() => toggleTask(t)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem',
                    }}>
                      {t.enabled ? '🟢' : '🔴'}
                    </button>
                  </td>
                  <td style={tdStyle}><strong>{t.title}</strong></td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.cron_expression}</td>
                  <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.prompt}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.85rem' }}>{t.last_run_at || '—'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/tasks/${t.id}/edit`} style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.85rem' }}>Editar</Link>
                      <Link to={`/tasks/${t.id}/logs`} style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.85rem' }}>Logs</Link>
                      <button onClick={() => deleteTask(t.id)} style={{
                        background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', padding: 0,
                      }}>
                        Eliminar
                      </button>
                    </div>
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
