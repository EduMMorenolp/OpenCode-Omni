import React from 'react';
import { colors, glassmorphism, spacing, transitions } from '../styles/theme';

// Glassmorphic Card Component
export function GlassCard({ children, elevated = false, onClick, className = '', style = {} }) {
  const baseStyle = {
    ...(elevated ? glassmorphism.glassElevated : glassmorphism.glass),
    borderRadius: '12px',
    padding: spacing.lg,
    transition: `all ${transitions.base}`,
    cursor: onClick ? 'pointer' : 'default',
  };

  if (onClick) {
    return (
      <div
        onClick={onClick}
        className={className}
        style={{
          ...baseStyle,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={{ ...baseStyle, ...style }}>
      {children}
    </div>
  );
}

// Glassmorphic Button Component
export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  style = {},
}) {
  const baseStyle = {
    padding: size === 'sm' ? '0.4rem 0.8rem' : size === 'lg' ? '0.8rem 1.6rem' : '0.6rem 1.2rem',
    fontSize: size === 'sm' ? '0.85rem' : size === 'lg' ? '1.05rem' : '0.95rem',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm,
    transition: `all ${transitions.base}`,
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary.from}, ${colors.primary.to})`,
      color: '#fff',
      boxShadow: `0 4px 12px rgba(59, 130, 246, 0.3)`,
    },
    secondary: {
      ...glassmorphism.glass,
      color: colors.text.primary,
      border: `1px solid ${colors.border.light}`,
    },
    danger: {
      background: `rgba(239, 68, 68, 0.15)`,
      color: '#fca5a5',
      border: `1px solid rgba(239, 68, 68, 0.3)`,
    },
    ghost: {
      background: 'transparent',
      color: colors.primary.light,
      border: `1px solid ${colors.primary.light}`,
    },
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{ ...baseStyle, ...variants[variant] }}
    >
      {children}
    </button>
  );
}

// Status Indicator Component
export function StatusIndicator({ status = 'offline', label = '' }) {
  const statusColors = {
    online: colors.status.online,
    offline: colors.status.offline,
    connecting: colors.status.connecting,
    error: colors.status.error,
  };

  const color = statusColors[status] || statusColors.offline;
  const glow = status === 'online' ? `0 0 8px ${color}` : 'none';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          boxShadow: glow,
          flexShrink: 0,
        }}
      />
      {label && <span style={{ fontSize: '0.85rem', color: colors.text.tertiary }}>{label}</span>}
    </div>
  );
}

// Data Grid Component
export function DataGrid({ columns, data, onRowClick, compact = false }) {
  const rowHeight = compact ? '40px' : '50px';

  return (
    <div
      style={{
        overflowX: 'auto',
        borderRadius: '12px',
        border: `1px solid ${colors.border.light}`,
        background: glassmorphism.glass.background,
        backdropFilter: glassmorphism.glass.backdropFilter,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              borderBottom: `1px solid ${colors.border.light}`,
              background: glassmorphism.glassSubtle.background,
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: col.align || 'left',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: colors.text.tertiary,
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: `1px solid ${colors.border.subtle}`,
                height: rowHeight,
                cursor: onRowClick ? 'pointer' : 'default',
                transition: `all ${transitions.fast}`,
                background: onRowClick ? 'rgba(59, 130, 246, 0)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0)';
                }
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: `${spacing.md} ${spacing.lg}`,
                    textAlign: col.align || 'left',
                    fontSize: '0.9rem',
                    color: colors.text.primary,
                    whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Alert/Notification Component
export function Alert({ type = 'info', title = '', message = '', onClose }) {
  const typeColors = {
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#93c5fd' },
    success: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fcd34d' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5' },
  };

  const color = typeColors[type] || typeColors.info;

  return (
    <div
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: '8px',
        padding: `${spacing.lg}`,
        color: color.text,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      <div>
        {title && <div style={{ fontWeight: 600, marginBottom: spacing.sm }}>{title}</div>}
        {message && <div style={{ fontSize: '0.9rem' }}>{message}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: color.text,
            cursor: 'pointer',
            fontSize: '1.2rem',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Loading Spinner Component
export function LoadingSpinner({ size = 'md', message = '' }) {
  const sizes = {
    sm: '20px',
    md: '32px',
    lg: '48px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.lg }}>
      <div
        style={{
          width: sizes[size],
          height: sizes[size],
          border: `2px solid ${colors.border.light}`,
          borderTopColor: colors.primary.light,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && <p style={{ color: colors.text.tertiary, fontSize: '0.9rem' }}>{message}</p>}
    </div>
  );
}

// Input Component
export function GlassInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: spacing.lg }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: spacing.sm,
            fontSize: '0.9rem',
            fontWeight: 500,
            color: colors.text.secondary,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: `${spacing.md} ${spacing.lg}`,
          background: colors.background.surface,
          border: `1px solid ${colors.border.light}`,
          borderRadius: '8px',
          color: colors.text.primary,
          fontSize: '0.95rem',
          transition: `all ${transitions.base}`,
          fontFamily: 'inherit',
        }}
        {...props}
      />
    </div>
  );
}

// Stats Card Component
export function StatsCard({ icon, label, value, trend = null }) {
  return (
    <GlassCard elevated>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
        {icon && <div style={{ fontSize: '2rem' }}>{icon}</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8rem', color: colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: colors.text.primary, marginTop: spacing.sm }}>
            {value}
          </div>
          {trend && (
            <div
              style={{
                fontSize: '0.8rem',
                color: trend > 0 ? colors.status.online : trend < 0 ? colors.status.error : colors.text.tertiary,
                marginTop: spacing.sm,
              }}
            >
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default {
  GlassCard,
  GlassButton,
  StatusIndicator,
  DataGrid,
  Alert,
  LoadingSpinner,
  GlassInput,
  StatsCard,
};
