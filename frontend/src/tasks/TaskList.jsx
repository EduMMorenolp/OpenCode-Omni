import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { GlassCard, GlassButton, DataGrid, Alert, LoadingSpinner, StatsCard } from '../components/GlassComponents';
import { colors, spacing, transitions, glassmorphism } from '../styles/theme';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

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
    if (!confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return;
    try {
      await api.tasks.delete(taskId);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'enabled') return t.enabled;
    if (filter === 'disabled') return !t.enabled;
    return true;
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.enabled).length,
    inactive: tasks.filter(t => !t.enabled).length,
  };

  const columns = [
    {
      key: 'enabled',
      label: 'Estado',
      width: '60px',
      render: (_, row) => (
        <button
          onClick={() => toggleTask(row)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: `transform ${transitions.base}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {row.enabled ? '🟢' : '🔴'}
        </button>
      ),
    },
    {
      key: 'title',
      label: 'Título',
      render: (val) => (
        <div style={{ fontWeight: 500, color: colors.text.primary }}>
          {val}
        </div>
      ),
    },
    {
      key: 'cron_expression',
      label: 'Programación',
      width: '120px',
      render: (val) => (
        <code style={{ fontSize: '0.85rem', color: colors.primary.light }}>
          {val}
        </code>
      ),
    },
    {
      key: 'prompt',
      label: 'Descripción',
      width: '200px',
      render: (val) => (
        <span style={{ fontSize: '0.9rem', color: colors.text.tertiary }} title={val}>
          {val?.substring(0, 50)}...
        </span>
      ),
    },
    {
      key: 'last_run_at',
      label: 'Última ejecución',
      width: '140px',
      render: (val) => (
        <span style={{ fontSize: '0.9rem', color: colors.text.tertiary }}>
          {val ? new Date(val).toLocaleString() : 'Nunca'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      width: '180px',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Link
            to={`/tasks/${id}/logs`}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'rgba(59, 130, 246, 0.1)',
              color: colors.primary.light,
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: `all ${transitions.base}`,
              border: `1px solid rgba(59, 130, 246, 0.2)`,
            }}
          >
            📊 Logs
          </Link>
          <Link
            to={`/tasks/${id}/edit`}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#d8b4fe',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: `all ${transitions.base}`,
              border: `1px solid rgba(139, 92, 246, 0.2)`,
            }}
          >
            ✏️ Editar
          </Link>
          <button
            onClick={() => deleteTask(id)}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              border: `1px solid rgba(239, 68, 68, 0.2)`,
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: `all ${transitions.base}`,
            }}
          >
            🗑️ Eliminar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: spacing.xxl,
        background: colors.background.base,
      }}
    >
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xl,
          gap: spacing.lg,
          flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: colors.text.primary,
              margin: 0,
              marginBottom: spacing.sm,
            }}>
              📋 Tareas Programadas
            </h1>
            <p style={{ color: colors.text.tertiary, margin: 0 }}>
              Gestiona y controla tus tareas automáticas
            </p>
          </div>
          <Link to="/tasks/new" style={{ textDecoration: 'none' }}>
            <GlassButton variant="primary" size="lg">
              ➕ Nueva Tarea
            </GlassButton>
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}>
          <StatsCard icon="📊" label="Total" value={stats.total} />
          <StatsCard icon="🟢" label="Activas" value={stats.active} trend={10} />
          <StatsCard icon="🔴" label="Inactivas" value={stats.inactive} trend={-5} />
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xxxl }}>
          <LoadingSpinner size="lg" message="Cargando tareas..." />
        </div>
      ) : filteredTasks.length === 0 ? (
        <GlassCard elevated>
          <div style={{ textAlign: 'center', padding: spacing.xxxl }}>
            <div style={{ fontSize: '3rem', marginBottom: spacing.lg }}>📋</div>
            <h2 style={{ color: colors.text.primary, marginBottom: spacing.md }}>
              No hay tareas programadas
            </h2>
            <p style={{ color: colors.text.tertiary, marginBottom: spacing.lg }}>
              {filter === 'all'
                ? 'Crea una tarea para empezar. Usa /task en Telegram o haz clic en "Nueva Tarea".'
                : `No hay tareas ${filter === 'enabled' ? 'activas' : 'inactivas'}`}
            </p>
            {filter !== 'all' && (
              <GlassButton variant="secondary" onClick={() => setFilter('all')}>
                Ver todas las tareas
              </GlassButton>
            )}
          </div>
        </GlassCard>
      ) : (
        <>
          <div style={{
            display: 'flex',
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}>
            {[
              { key: 'all', label: `📋 Todas (${stats.total})` },
              { key: 'enabled', label: `🟢 Activas (${stats.active})` },
              { key: 'disabled', label: `🔴 Inactivas (${stats.inactive})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  borderRadius: '8px',
                  border: filter === tab.key ? 'none' : `1px solid ${colors.border.light}`,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: `all ${transitions.base}`,
                  background: filter === tab.key
                    ? `linear-gradient(135deg, ${colors.primary.from}, ${colors.primary.to})`
                    : glassmorphism.glass.background,
                  color: filter === tab.key ? '#fff' : colors.text.tertiary,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <GlassCard elevated>
            <DataGrid
              columns={columns}
              data={filteredTasks}
              compact={false}
            />
          </GlassCard>
        </>
      )}
    </div>
  );
}
