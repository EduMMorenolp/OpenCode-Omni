import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      fontFamily: 'system-ui, sans-serif',
    },
    card: {
      background: '#1e293b',
      padding: '2rem',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    },
    title: { color: '#f1f5f9', margin: '0 0 0.5rem', fontSize: '1.5rem' },
    subtitle: { color: '#94a3b8', margin: '0 0 1.5rem', fontSize: '0.9rem' },
    input: {
      width: '100%',
      padding: '0.75rem',
      marginBottom: '1rem',
      border: '1px solid #334155',
      borderRadius: '8px',
      background: '#0f172a',
      color: '#f1f5f9',
      fontSize: '1rem',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      background: '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      cursor: 'pointer',
      opacity: loading ? 0.6 : 1,
    },
    error: { color: '#ef4444', marginTop: '0.75rem', fontSize: '0.875rem' },
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>OpenCode-Omni</h1>
        <p style={styles.subtitle}>Inicia sesión en el panel de administración</p>
        <input
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
