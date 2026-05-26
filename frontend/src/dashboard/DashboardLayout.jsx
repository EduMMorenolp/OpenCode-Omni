import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const linkBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.5rem 0.75rem',
  color: '#94a3b8',
  textDecoration: 'none',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 400,
  transition: 'all 0.15s ease',
};

const linkActive = {
  ...linkBase,
  background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))',
  color: '#f1f5f9',
  fontWeight: 500,
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
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: '#f1f5f9' }}>
      <nav style={{
        width: '240px',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        padding: '1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.25rem 0.5rem 1rem',
          marginBottom: '0.5rem',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
          }}>
            ⚡
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>OpenCode-Omni</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.username || 'admin'}</div>
          </div>
        </div>

        <div style={{ padding: '0.25rem 0.5rem', marginBottom: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            background: ocStatus === null ? 'transparent' : ocStatus ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${ocStatus === null ? '#1e293b' : ocStatus ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: ocStatus === null ? '#64748b' : ocStatus ? '#4ade80' : '#f87171',
            marginBottom: '0.4rem',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: ocStatus === null ? '#64748b' : ocStatus ? '#22c55e' : '#ef4444',
              flexShrink: 0,
              boxShadow: ocStatus ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
            }} />
            OpenCode {ocStatus === null ? '...' : ocStatus ? 'Conectado' : 'Offline'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            background: telegramStatus === 'connected' ? 'rgba(34,197,94,0.08)' : 'transparent',
            border: `1px solid ${telegramStatus === 'connected' ? 'rgba(34,197,94,0.2)' : '#1e293b'}`,
            color: telegramStatus === 'connected' ? '#4ade80' : telegramStatus === 'disconnected' ? '#94a3b8' : '#64748b',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: telegramStatus === 'connected' ? '#22c55e' : telegramStatus === 'disconnected' ? '#64748b' : '#ef4444',
              flexShrink: 0,
            }} />
            Telegram {telegramStatus === 'connected' ? 'Conectado' : telegramStatus === 'disconnected' ? 'Desconectado' : telegramStatus === 'error' ? 'Error' : '...'}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => isActive ? linkActive : linkBase}
            >
              <span style={{ width: '1.4rem', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #1e293b', marginTop: '0.5rem' }}>
          <NavLink to="/settings" style={({ isActive }) => isActive ? linkActive : {
            ...linkBase,
            fontSize: '0.8rem',
          }}>
            <span style={{ width: '1.4rem', textAlign: 'center', flexShrink: 0 }}>⚙️</span>
            Ajustes
          </NavLink>
          <button onClick={handleLogout} style={{
            ...linkBase,
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: '#64748b',
          }}>
            <span style={{ width: '1.4rem', textAlign: 'center', flexShrink: 0 }}>🚪</span>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
