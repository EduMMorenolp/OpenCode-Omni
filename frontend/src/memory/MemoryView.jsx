import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function MemoryView() {
  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      setError('');
      const [lessonsData, statsData] = await Promise.all([
        api.memory.lessons(search),
        api.memory.stats(),
      ]);
      setLessons(lessonsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  async function deleteLesson(id) {
    if (!confirm('¿Eliminar esta lección?')) return;
    try {
      await api.memory.delete(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const inputStyle = {
    padding: '0.6rem 0.75rem', border: '1px solid #334155', borderRadius: '6px',
    background: '#0f172a', color: '#f1f5f9', fontSize: '0.9rem', flex: 1,
  };
  const thStyle = {
    textAlign: 'left', padding: '0.6rem 0.5rem', borderBottom: '1px solid #1e293b',
    color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const tdStyle = {
    padding: '0.6rem 0.5rem', borderBottom: '1px solid #1e293b',
    fontSize: '0.85rem', verticalAlign: 'top',
  };

  const sourceIcons = { task: '⚙️', manual: '✍️', telegram: '📱' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>🧠 Lecciones Aprendidas</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
          <input style={inputStyle} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lecciones..." />
        </div>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '8px', minWidth: '100px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.total}</div>
          </div>
          {stats.bySource?.map(s => (
            <div key={s.source_type} style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '8px', minWidth: '100px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sourceIcons[s.source_type] || '📄'} {s.source_type}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{s.count}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
        💡 Las lecciones se generan automáticamente al completar tareas programadas. También puedes consultarlas desde Telegram con <code>/learn</code>.
      </div>

      {error && <p style={{ color: '#ef4444', padding: '0.75rem', background: '#450a0a', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#64748b' }}>Cargando...</p>
      ) : lessons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sin lecciones aún</p>
          <p>Completa tareas programadas para que el sistema genere lecciones automáticamente.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Fuente</th>
                <th style={thStyle}>Título</th>
                <th style={thStyle}>Lección</th>
                <th style={thStyle}>Tags</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id}>
                  <td style={{ ...tdStyle, fontSize: '0.8rem' }}>
                    {sourceIcons[l.source_type] || '📄'}
                  </td>
                  <td style={tdStyle}><strong>{l.title.substring(0, 60)}</strong></td>
                  <td style={{ ...tdStyle, maxWidth: '400px', fontSize: '0.8rem' }}>
                    {l.content.substring(0, 200)}{l.content.length > 200 ? '...' : ''}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem' }}>
                    {l.tags ? l.tags.split(',').map(t => (
                      <span key={t} style={{
                        display: 'inline-block', padding: '0.1rem 0.4rem', margin: '0.1rem',
                        borderRadius: '4px', background: '#0f172a', color: '#60a5fa', fontSize: '0.75rem',
                      }}>{t.trim()}</span>
                    )) : '—'}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{l.created_at}</td>
                  <td style={tdStyle}>
                    <button onClick={() => deleteLesson(l.id)} style={{
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: 0,
                    }}>✕</button>
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
