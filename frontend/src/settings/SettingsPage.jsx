import React from 'react';
import TelegramConnect from '../telegram/TelegramConnect';

export default function SettingsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '700px' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.25rem' }}>⚙️ Ajustes</h2>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' }}>
        Configuración del sistema
      </p>

      <TelegramConnect />
    </div>
  );
}
