import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [ocStatus, setOcStatus] = useState(null);
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
    const interval = setInterval(() => {
      api.opencode.health()
        .then(d => setOcStatus(d.healthy))
        .catch(() => setOcStatus(false));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const linkStyle = {
    display: 'block',
    padding: '0.6rem 1rem',
    color: '#94a3b8',
    textDecoration: 'none',
    borderRadius: '8px',
    marginBottom: '0.25rem',
    fontSize: '0.9rem',
  };
  const activeStyle = {
    ...linkStyle,
    background: '#1e293b',
    color: '#f1f5f9',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#f1f5f9' }}>
      <nav style={{
        width: '240px',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem' }}>OpenCode-Omni</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.5rem' }}>
          {user.username || 'admin'}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          background: ocStatus === null ? '#1e293b' : ocStatus ? '#064e3b' : '#450a0a',
          border: `1px solid ${ocStatus === null ? '#334155' : ocStatus ? '#065f46' : '#7f1d1d'}`,
          color: ocStatus === null ? '#94a3b8' : ocStatus ? '#6ee7b7' : '#fca5a5',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ocStatus === null ? '#64748b' : ocStatus ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
          {ocStatus === null ? 'Conectando...' : ocStatus ? 'OpenCode OK' : 'OpenCode Offline'}
        </div>

        <NavLink to="/" end style={({ isActive }) => isActive ? activeStyle : linkStyle}>
          📋 Tareas
        </NavLink>
        <NavLink to="/tasks/new" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
          ➕ Nueva Tarea
        </NavLink>
        <NavLink to="/sessions" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
          💬 Sesiones
        </NavLink>
        <NavLink to="/hooks" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
          ⚡ Hooks
        </NavLink>
        <NavLink to="/memory" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
          🧠 Memoria
        </NavLink>
        <NavLink to="/vision" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
          📄 Documentos
        </NavLink>
        <NavLink to="/history" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
          📜 Historial
        </NavLink>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} style={{
            width: '100%',
            padding: '0.5rem',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
