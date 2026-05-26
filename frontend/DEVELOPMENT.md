# Frontend Development Guide

## 🚀 Quick Start

### Installing & Running
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 🎨 Using the Design System

### Import Theme
```jsx
import { colors, spacing, transitions, glassmorphism } from '../styles/theme';
```

### Import Components
```jsx
import { 
  GlassCard, 
  GlassButton, 
  DataGrid, 
  Alert, 
  LoadingSpinner,
  StatsCard 
} from '../components/GlassComponents';
```

## 📋 Component Examples

### Basic Card
```jsx
<GlassCard elevated>
  <h3>Tarjeta Importante</h3>
  <p>Contenido aquí</p>
</GlassCard>
```

### Button Variants
```jsx
<GlassButton variant="primary">Acción Principal</GlassButton>
<GlassButton variant="secondary">Acción Secundaria</GlassButton>
<GlassButton variant="danger">Eliminar</GlassButton>
<GlassButton variant="ghost">Enlace</GlassButton>
```

### Data Table
```jsx
<DataGrid
  columns={[
    { key: 'name', label: 'Nombre' },
    { key: 'status', label: 'Estado', width: '100px' },
    { 
      key: 'actions', 
      label: 'Acciones',
      render: (_, row) => (
        <button onClick={() => handleClick(row)}>Editar</button>
      )
    }
  ]}
  data={items}
  onRowClick={handleRowClick}
  compact={false}
/>
```

### Stats Card
```jsx
<StatsCard 
  icon="📊" 
  label="Total" 
  value={42} 
  trend={10}
/>
```

### Alert
```jsx
<Alert
  type="success"
  title="¡Éxito!"
  message="La operación se completó correctamente"
  onClose={() => setAlert(null)}
/>
```

### Loading
```jsx
<LoadingSpinner 
  size="lg" 
  message="Cargando datos..." 
/>
```

## 🎨 Styling Patterns

### Using Theme Colors
```jsx
<div style={{
  background: colors.background.surface,
  border: `1px solid ${colors.border.light}`,
  color: colors.text.primary,
  padding: spacing.lg,
}}>
  Contenido
</div>
```

### Glassmorphism Effect
```jsx
<div style={{
  ...glassmorphism.glass,
  borderRadius: '12px',
  padding: spacing.lg,
}}>
  Efecto vidrio
</div>
```

### Smooth Transitions
```jsx
<div style={{
  transition: `all ${transitions.base}`,
  cursor: 'pointer',
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = shadows.lg;
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'none';
  e.currentTarget.style.boxShadow = 'none';
}}
>
  Hover aquí
</div>
```

## 📐 CSS Classes

### Use Built-in Classes
```html
<div class="card card-elevated">
  <h3>Título</h3>
  <p>Contenido</p>
</div>

<button class="btn btn-primary btn-lg">Click me</button>

<span class="badge badge-success">Activo</span>
```

## 🔄 Common Patterns

### Form Input
```jsx
<div style={{ marginBottom: spacing.lg }}>
  <label style={{
    display: 'block',
    marginBottom: spacing.sm,
    color: colors.text.secondary,
    fontWeight: 500,
  }}>
    Nombre
  </label>
  <input
    type="text"
    placeholder="Ingresa nombre..."
    style={{
      width: '100%',
      padding: `${spacing.md} ${spacing.lg}`,
      background: colors.background.surface,
      border: `1px solid ${colors.border.light}`,
      borderRadius: '8px',
      color: colors.text.primary,
      fontSize: '0.95rem',
      transition: `all ${transitions.base}`,
    }}
  />
</div>
```

### Loading State
```jsx
{loading ? (
  <LoadingSpinner size="lg" message="Cargando..." />
) : items.length === 0 ? (
  <div style={{ textAlign: 'center', padding: spacing.xxl }}>
    <p style={{ color: colors.text.tertiary }}>Sin elementos</p>
  </div>
) : (
  <DataGrid columns={columns} data={items} />
)}
```

### Error Handling
```jsx
{error && (
  <Alert
    type="error"
    title="Error"
    message={error}
    onClose={() => setError('')}
  />
)}
```

## 🎯 Best Practices

### 1. Always Use Theme Values
```jsx
// ✅ Good
background: colors.background.surface

// ❌ Bad
background: '#1e293b'
```

### 2. Reuse Components
```jsx
// ✅ Good
<GlassCard elevated>Content</GlassCard>

// ❌ Bad
<div style={{...complexStyles}}>Content</div>
```

### 3. Consistent Spacing
```jsx
// ✅ Good
padding: spacing.lg

// ❌ Bad
padding: '16px'
```

### 4. Use Transitions
```jsx
// ✅ Good
transition: `all ${transitions.base}`

// ❌ Bad
transition: 'all 0.2s'
```

## 📱 Responsive Tips

### Grid Layout
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing.lg,
}}>
  {/* Items */}
</div>
```

### Flex Layout
```jsx
<div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing.lg,
}}>
  {/* Items */}
</div>
```

## 🔗 Useful Links

- Theme file: `src/styles/theme.js`
- Components: `src/components/GlassComponents.jsx`
- Global CSS: `src/App.css`
- Design System Docs: `frontend/DESIGN_SYSTEM.md`

## 🐛 Troubleshooting

### Glassmorphism Effect Not Working
- Check browser support for `backdrop-filter`
- Ensure `background` has low opacity (0.6-0.8)
- Test in Chrome/Firefox

### Colors Look Wrong
- Verify CSS variables are loaded
- Check system color scheme (dark mode)
- Clear browser cache

### Performance Issues
- Reduce number of elements with backdrop-filter
- Use CSS classes instead of inline styles for repeated elements
- Optimize images

## 📖 Further Reading

- [Glassmorphism Design](https://glassmorphism.com)
- [Dark Mode Design](https://ui.dev/dark-mode)
- [Accessibility Best Practices](https://www.a11y-101.com)

---

**Last Updated:** May 26, 2026
**Version:** 1.0
**Theme:** Glassmorphism Dark
