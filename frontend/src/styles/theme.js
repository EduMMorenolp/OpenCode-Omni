/**
 * Glassmorphism Dark Theme - Design System
 * Optimized for focus and productivity
 */

export const colors = {
  // Primary gradients
  primary: {
    from: '#3b82f6',
    to: '#8b5cf6',
    light: '#60a5fa',
    dark: '#1e40af',
  },
  secondary: {
    from: '#8b5cf6',
    to: '#d946ef',
    light: '#a78bfa',
  },
  accent: {
    cyan: '#06b6d4',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Dark mode palette
  background: {
    base: '#0f172a',
    surface: '#1e293b',
    surface2: '#334155',
    surface3: '#475569',
  },

  text: {
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    muted: '#64748b',
  },

  border: {
    subtle: '#1e293b',
    light: '#334155',
    medium: '#475569',
  },

  status: {
    online: '#10b981',
    offline: '#64748b',
    connecting: '#f59e0b',
    error: '#ef4444',
  },
};

export const glassmorphism = {
  // Base glass effect
  glass: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  },

  // Elevated glass
  glassElevated: {
    background: 'rgba(30, 41, 59, 0.75)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
  },

  // Subtle glass
  glassSubtle: {
    background: 'rgba(30, 41, 59, 0.4)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(148, 163, 184, 0.08)',
  },

  // Hover state
  glassHover: {
    background: 'rgba(51, 65, 85, 0.7)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  },

  // Active state
  glassActive: {
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
  xl: '0 12px 32px rgba(0, 0, 0, 0.6)',

  // Glow effects
  glowBlue: '0 0 20px rgba(59, 130, 246, 0.3)',
  glowPurple: '0 0 20px rgba(139, 92, 246, 0.3)',
  glowGreen: '0 0 20px rgba(16, 185, 129, 0.3)',
  glowRed: '0 0 20px rgba(239, 68, 68, 0.3)',
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  xxl: '2rem',
  xxxl: '3rem',
};

export const transitions = {
  fast: '150ms ease-out',
  base: '200ms ease-out',
  slow: '300ms ease-out',
  slower: '500ms ease-out',
};

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

// Utility function builders
export const getGlassStyle = (variant = 'default', props = {}) => {
  const variants = {
    default: glassmorphism.glass,
    elevated: glassmorphism.glassElevated,
    subtle: glassmorphism.glassSubtle,
  };

  return {
    ...variants[variant] || variants.default,
    ...props,
  };
};

export const getButtonStyle = (type = 'primary', size = 'md') => {
  const sizes = {
    sm: { padding: '0.4rem 0.8rem', fontSize: '0.85rem' },
    md: { padding: '0.6rem 1.2rem', fontSize: '0.95rem' },
    lg: { padding: '0.8rem 1.6rem', fontSize: '1.05rem' },
  };

  const types = {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary.from}, ${colors.primary.to})`,
      color: '#fff',
      border: 'none',
    },
    secondary: {
      ...glassmorphism.glass,
      color: colors.text.primary,
      border: `1px solid ${colors.border.light}`,
    },
    ghost: {
      background: 'transparent',
      color: colors.primary.light,
      border: `1px solid ${colors.primary.light}`,
    },
  };

  return {
    ...types[type] || types.primary,
    ...sizes[size] || sizes.md,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: `all ${transitions.base}`,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  };
};

export const getCardStyle = (elevated = false) => {
  return {
    ...getGlassStyle(elevated ? 'elevated' : 'default'),
    borderRadius: '12px',
    padding: spacing.lg,
    transition: `all ${transitions.base}`,
  };
};

export const getInputStyle = () => {
  return {
    padding: `${spacing.md} ${spacing.lg}`,
    background: colors.background.surface,
    border: `1px solid ${colors.border.light}`,
    borderRadius: '8px',
    color: colors.text.primary,
    fontSize: '0.95rem',
    transition: `all ${transitions.base}`,
    fontFamily: 'inherit',
    '&:focus': {
      outline: 'none',
      borderColor: colors.primary.light,
      boxShadow: shadows.glowBlue,
    },
  };
};

export default {
  colors,
  glassmorphism,
  shadows,
  spacing,
  transitions,
  breakpoints,
  getGlassStyle,
  getButtonStyle,
  getCardStyle,
  getInputStyle,
};
