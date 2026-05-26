import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function TaskLogs() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [taskData, logsData] = await Promise.all([
          api.tasks.get(id),
          api.tasks.logs(id),
        ]);
        setTask(taskData);
        setLogs(logsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(async () => {
      try {
        const logsData = await api.tasks.logs(id);
        setLogs(logsData);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <p style={{ color: '#64748b' }}>Cargando...</p>;
  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>;

  const thStyle = {
    textAlign: 'left', padding: '0.75rem 0.5rem', borderBottom: '1px solid #1e293b',
    color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const tdStyle = {
    padding: '0.75rem 0.5rem', borderBottom: '1px solid #1e293b', fontSize: '0.85rem', verticalAlign: 'top',
  };

  return (
    <div>
      <Link to="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem', display: 'block', marginBottom: '1rem' }}>
        ← Volver a tareas
      </Link>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{task?.title}</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Cron: <code style={{ background: '#1e293b', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{task?.cron_expression}</code>
        {' '}— Última ejecución: {task?.last_run_at || '—'}
      </p>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Sin ejecuciones registradas.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Inicio</th>
                <th style={thStyle}>Fin</th>
                <th style={thStyle}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                      background: log.status === 'success' ? '#064e3b' : log.status === 'failed' ? '#450a0a' : '#1e293b',
                      color: log.status === 'success' ? '#6ee7b7' : log.status === 'failed' ? '#fca5a5' : '#94a3b8',
                    }}>
                      {log.status === 'success' ? '✅ Éxito' : log.status === 'failed' ? '❌ Error' : '⏳ Ejecutando'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem' }}>{log.started_at || '—'}</td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem' }}>{log.completed_at || '—'}</td>
                  <td style={{ ...tdStyle, maxWidth: '400px', fontSize: '0.8rem' }}>
                    {log.error ? (
                      <span style={{ color: '#fca5a5' }}>{log.error}</span>
                    ) : log.result ? (
                      <span style={{
                        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>{log.result}</span>
                    ) : '—'}
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
