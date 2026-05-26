import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function TaskForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ title: '', prompt: '', cron_expression: '', agent: 'default' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (isEdit && firstLoad) {
      setFirstLoad(false);
      api.tasks.get(id).then(data => {
        setForm({ title: data.title, prompt: data.prompt, cron_expression: data.cron_expression, agent: data.agent || 'default' });
      }).catch(err => setError(err.message));
    }
  }, [isEdit, id, firstLoad]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await api.tasks.update(id, form);
      } else {
        await api.tasks.create(form);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #334155',
    borderRadius: '8px',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    marginTop: '0.25rem',
  };
  const labelStyle = {
    display: 'block',
    marginBottom: '1rem',
    color: '#cbd5e1',
    fontSize: '0.9rem',
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        {isEdit ? 'Editar Tarea' : 'Nueva Tarea'}
      </h1>

      {error && <p style={{ color: '#ef4444', padding: '0.75rem', background: '#450a0a', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>
          Título
          <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </label>

        <label style={labelStyle}>
          Prompt (instrucción para OpenCode)
          <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} required />
        </label>

        <label style={labelStyle}>
          Expresión Cron (5 campos)
          <input style={{ ...inputStyle, fontFamily: 'monospace' }}
            value={form.cron_expression}
            onChange={e => setForm({ ...form, cron_expression: e.target.value })}
            placeholder="0 9 * * *"
            required />
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
            minuto hora día-del-mes mes día-de-la-semana
          </span>
        </label>

        <label style={labelStyle}>
          Agente (opcional)
          <input style={inputStyle} value={form.agent} onChange={e => setForm({ ...form, agent: e.target.value })} placeholder="default" />
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="submit" disabled={loading} style={{
            padding: '0.6rem 1.5rem',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Tarea'}
          </button>
          <button type="button" onClick={() => navigate('/')} style={{
            padding: '0.6rem 1.5rem',
            background: '#1e293b',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
