import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { GlassButton, StatusIndicator } from '../components/GlassComponents';
import { colors, spacing, transitions, glassmorphism } from '../styles/theme';

const linkBase = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  padding: `${spacing.md} ${spacing.lg}`,
  color: colors.text.tertiary,
  textDecoration: 'none',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 400,
  transition: `all ${transitions.base}`,
};

const linkActive = {
  ...linkBase,
  background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
  color: colors.text.primary,
  fontWeight: 500,
  borderLeft: `3px solid ${colors.primary.from}`,
  paddingLeft: `calc(${spacing.lg} - 3px)`,
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [ocStatus, setOcStatus] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  useEffect(() => {
    api.opencode.health()
      .then(d => setOcStatus(d.healthy))
      .catch(() => setOcStatus(false));

    api.settings.telegramStatus()
      .then(d => setTelegramStatus(d.configured ? 'connected' : 'disconnected'))
      .catch(() => setTelegramStatus('error'));

    const interval = setInterval(() => {
      api.opencode.health()
        .then(d => setOcStatus(d.healthy))
        .catch(() => setOcStatus(false));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Chat', icon: '💬', end: true },
    { to: '/tasks', label: 'Tareas', icon: '📋' },
    { to: '/tasks/new', label: 'Nueva Tarea', icon: '➕' },
    { to: '/sessions', label: 'Sesiones', icon: '🔌' },
    { to: '/hooks', label: 'Hooks', icon: '⚡' },
    { to: '/memory', label: 'Memoria', icon: '🧠' },
    { to: '/vision', label: 'Documentos', icon: '📄' },
    { to: '/history', label: 'Historial', icon: '📜' },
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: colors.background.base,
      color: colors.text.primary,
      overflow: 'hidden',
    }}>
      {/* Sidebar Navigation */}
      <nav style={{
        width: '260px',
        background: glassmorphism.glassElevated.background,
        backdropFilter: glassmorphism.glassElevated.backdropFilter,
        borderRight: `1px solid ${colors.border.light}`,
        padding: `${spacing.lg} 0`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.md} ${spacing.lg}`,
          marginBottom: spacing.lg,
          borderBottom: `1px solid ${colors.border.light}`,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${colors.primary.from}, ${colors.secondary.from})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0,
            boxShadow: `0 0 12px rgba(59, 130, 246, 0.4)`,
          }}>
            ⚡
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: colors.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              OpenCode-Omni
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: colors.text.tertiary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user.username || 'admin'}
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div style={{
          padding: `0 ${spacing.lg} ${spacing.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: '8px',
            fontSize: '0.8rem',
            background: ocStatus === null ? 'transparent' : ocStatus ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${ocStatus === null ? colors.border.light : ocStatus ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: ocStatus === null ? colors.text.tertiary : ocStatus ? '#6ee7b7' : '#fca5a5',
            fontWeight: 500,
          }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: ocStatus === null ? colors.text.tertiary : ocStatus ? colors.status.online : colors.status.error,
                flexShrink: 0,
                boxShadow: ocStatus ? `0 0 8px ${colors.status.online}` : 'none',
              }}
            />
            OpenCode {ocStatus === null ? 'Verificando...' : ocStatus ? 'Conectado' : 'Offline'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: '8px',
            fontSize: '0.8rem',
            background: telegramStatus === 'connected' ? 'rgba(16,185,129,0.08)' : 'transparent',
            border: `1px solid ${telegramStatus === 'connected' ? 'rgba(16,185,129,0.2)' : colors.border.light}`,
            color: telegramStatus === 'connected' ? '#6ee7b7' : colors.text.tertiary,
            fontWeight: 500,
          }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: telegramStatus === 'connected' ? colors.status.online : colors.text.tertiary,
                flexShrink: 0,
              }}
            />
            Telegram {telegramStatus === 'connected' ? 'Conectado' : telegramStatus === 'disconnected' ? 'Desconectado' : 'Error'}
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `0 ${spacing.sm}`,
        }}>
          <div style={{ padding: `${spacing.md} ${spacing.sm}`, fontSize: '0.7rem', fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Principal
          </div>
          {navItems.slice(0, 1).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => isActive ? linkActive : linkBase}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div style={{ padding: `${spacing.md} ${spacing.sm} 0`, fontSize: '0.7rem', fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Gestión
          </div>
          {navItems.slice(1, 4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => isActive ? linkActive : linkBase}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div style={{ padding: `${spacing.md} ${spacing.sm} 0`, fontSize: '0.7rem', fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Información
          </div>
          {navItems.slice(4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => isActive ? linkActive : linkBase}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: `0 ${spacing.sm}`,
          borderTop: `1px solid ${colors.border.light}`,
          marginTop: spacing.lg,
          paddingTop: spacing.lg,
        }}>
          <NavLink
            to="/settings"
            style={({ isActive }) => isActive ? linkActive : linkBase}
          >
            <span style={{ fontSize: '1rem' }}>⚙️</span>
            Ajustes
          </NavLink>
          <button
            onClick={handleLogout}
            style={{
              ...linkBase,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.text.tertiary,
              justifyContent: 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.status.error;
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.text.tertiary;
              e.currentTarget.style.background = 'none';
            }}
          >
            <span style={{ fontSize: '1rem' }}>🚪</span>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: colors.background.base,
      }}>
        <Outlet />
      </main>
    </div>
  );
}
