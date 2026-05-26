import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { GlassCard, GlassButton, Alert, LoadingSpinner } from '../components/GlassComponents';
import { colors, spacing, transitions, glassmorphism } from '../styles/theme';

const BUILTIN_COMMANDS = [
  { name: 'help', description: 'Muestra esta ayuda', aliases: [] },
  { name: 'new', description: 'Inicia una nueva sesión', aliases: ['clear'] },
  { name: 'models', description: 'Lista los modelos disponibles', aliases: [] },
  { name: 'compact', description: 'Compacta la sesión para reducir contexto', aliases: ['summarize'] },
  { name: 'sessions', description: 'Lista y cambia entre sesiones', aliases: ['resume', 'continue'] },
  { name: 'undo', description: 'Deshace el último mensaje', aliases: [] },
  { name: 'redo', description: 'Rehace un mensaje deshecho', aliases: [] },
  { name: 'init', description: 'Guía de configuración de AGENTS.md', aliases: [] },
  { name: 'connect', description: 'Añade un proveedor de IA', aliases: [] },
  { name: 'thinking', description: 'Muestra/oculta bloques de razonamiento', aliases: [] },
  { name: 'details', description: 'Muestra/oculta detalles de herramientas', aliases: [] },
  { name: 'export', description: 'Exporta la conversación a Markdown', aliases: [] },
  { name: 'editor', description: 'Abre editor externo para redactar', aliases: [] },
  { name: 'exit', description: 'Cierra la sesión actual', aliases: ['quit', 'q'] },
  { name: 'themes', description: 'Lista los temas disponibles', aliases: [] },
  { name: 'share', description: 'Comparte la sesión actual', aliases: [] },
  { name: 'unshare', description: 'Deja de compartir la sesión', aliases: [] },
];

export default function ChatView() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [cmdIndex, setCmdIndex] = useState(0);
  const [allCommands, setAllCommands] = useState(BUILTIN_COMMANDS);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, streamingText]);
  useEffect(() => { inputRef.current?.focus(); }, [activeId]);

  useEffect(() => {
    api.opencode.listCommands()
      .then(cmds => { if (Array.isArray(cmds) && cmds.length > 0) setAllCommands(cmds); })
      .catch(() => {});
  }, []);

  function updateCommandFilter(val) {
    if (val.startsWith('/')) {
      const partial = val.slice(1).toLowerCase();
      const matches = allCommands.filter(c =>
        c.name.includes(partial) || (c.aliases || []).some(a => a.includes(partial))
      );
      setFilteredCommands(matches);
      setShowCommands(matches.length > 0);
      setCmdIndex(0);
    } else {
      setShowCommands(false);
    }
  }

  async function loadSessions() {
    try {
      const data = await api.opencode.sessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function selectSession(id) {
    setActiveId(id);
    setStreamingText('');
    try {
      const msgs = await api.opencode.getMessages(id, 50);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch {
      setMessages([]);
    }
  }

  function formatHelpText() {
    const list = allCommands.length > 0 ? allCommands : BUILTIN_COMMANDS;
    let text = '**Comandos disponibles**\n\nEscribe `/comando` para ejecutar.\n\n';
    for (const c of list) {
      const aliases = c.aliases?.length > 0 ? c.aliases.map(a => `/${a}`).join(', ') : '';
      text += `• **/${c.name}**`;
      if (aliases) text += ` (${aliases})`;
      text += ` — ${c.description}\n`;
    }
    text += '\n_Usa `!comando` para ejecutar comandos del sistema._';
    return text;
  }

  async function handleSlashCommand(cmdText) {
    const tokens = cmdText.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        setStreamingText('');
        setMessages(prev => [...prev, {
          info: { role: 'assistant' },
          parts: [{ type: 'text', text: formatHelpText() }],
        }]);
        return;

      case 'new':
      case 'clear':
        setStreamingText('');
        const newS = await api.opencode.createSession(`Chat ${new Date().toLocaleString()}`);
        setSessions(prev => [newS, ...prev]);
        setActiveId(newS.id);
        setMessages([{
          info: { role: 'assistant' },
          parts: [{ type: 'text', text: '✅ Nueva sesión creada. ¿En qué puedo ayudarte?' }],
        }]);
        return;

      case 'models':
        setStreamingText('');
        try {
          const config = await api.opencode.getConfig();
          let text = '**Modelos disponibles**\n\n';
          if (config?.providers?.length > 0) {
            for (const p of config.providers) {
              text += `*${p.name || p.id}*\n`;
              if (p.models?.length > 0) {
                for (const m of p.models) {
                  text += `  • \`${m.id}\`${m.name ? ` (${m.name})` : ''}\n`;
                }
              } else {
                text += '  _Sin modelos_\n';
              }
              text += '\n';
            }
          } else {
            text += 'No hay proveedores configurados.\nUsa `/connect` para añadir uno.';
          }
          setMessages(prev => [...prev, {
            info: { role: 'assistant' },
            parts: [{ type: 'text', text }],
          }]);
        } catch {
          setMessages(prev => [...prev, {
            info: { role: 'assistant' },
            parts: [{ type: 'text', text: '❌ No se pudieron obtener los modelos. OpenCode no está disponible.' }],
          }]);
        }
        return;

      case 'compact':
      case 'summarize':
        const compactResult = await api.opencode.summarizeSession(activeId);
        setStreamingText('');
        setMessages(prev => [...prev, {
          info: { role: 'assistant' },
          parts: compactResult?.parts || [{ type: 'text', text: '✅ Sesión compactada' }],
        }]);
        return;

      default:
        const fwdResult = await api.opencode.sendCommand(activeId, cmd, args);
        setStreamingText('');
        setMessages(prev => [...prev, {
          info: { role: 'assistant' },
          parts: fwdResult?.parts || [{ type: 'text', text: fwdResult?.text || `Comando /${cmd} ejecutado` }],
        }]);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setInput('');
    setShowCommands(false);
    setSending(true);

    if (!text.startsWith('/')) {
      setMessages(prev => [...prev, {
        info: { role: 'user' },
        parts: [{ type: 'text', text }],
      }]);
    }

    setStreamingText(text.startsWith('/') ? '' : 'OpenCode está pensando...');

    try {
      if (text.startsWith('/')) {
        await handleSlashCommand(text.slice(1).trim());
      } else if (text.startsWith('!')) {
        setStreamingText('');
        // Handle system commands
      } else {
        const result = await api.opencode.sendMessage(activeId, text);
        setStreamingText('');
        if (result?.parts) {
          setMessages(prev => [...prev, { info: { role: 'assistant' }, ...result }]);
        }
      }
    } catch (err) {
      setStreamingText('❌ Error: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
      }}>
        <LoadingSpinner size="lg" message="Cargando sesiones de chat..." />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: colors.background.base,
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: glassmorphism.glass.background,
        backdropFilter: glassmorphism.glass.backdropFilter,
        borderRight: `1px solid ${colors.border.light}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* New Chat Button */}
        <div style={{ padding: spacing.lg }}>
          <GlassButton
            variant="primary"
            style={{ width: '100%' }}
            onClick={() => handleSlashCommand('new')}
          >
            ➕ Nueva conversación
          </GlassButton>
        </div>

        {/* Search */}
        <div style={{ padding: `0 ${spacing.lg} ${spacing.lg}` }}>
          <input
            type="text"
            placeholder="Buscar sesiones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing.md} ${spacing.lg}`,
              background: colors.background.surface,
              border: `1px solid ${colors.border.light}`,
              borderRadius: '8px',
              color: colors.text.primary,
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* Sessions List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `0 ${spacing.sm}`,
        }}>
          {sessions
            .filter(s => !search || s.title?.toLowerCase().includes(search.toLowerCase()))
            .map(session => (
              <button
                key={session.id}
                onClick={() => selectSession(session.id)}
                style={{
                  width: '100%',
                  padding: `${spacing.md} ${spacing.lg}`,
                  margin: `0 0 ${spacing.sm}`,
                  background: activeId === session.id
                    ? 'rgba(59, 130, 246, 0.2)'
                    : glassmorphism.glassSubtle.background,
                  border: activeId === session.id
                    ? `1px solid ${colors.primary.light}`
                    : `1px solid ${colors.border.light}`,
                  borderRadius: '8px',
                  color: colors.text.primary,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: activeId === session.id ? 600 : 400,
                  transition: `all ${transitions.base}`,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                title={session.title}
              >
                💬 {session.title}
              </button>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {!activeId ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xxl,
            textAlign: 'center',
          }}>
            <GlassCard>
              <div style={{ fontSize: '3rem', marginBottom: spacing.lg }}>💬</div>
              <h2 style={{ color: colors.text.primary, marginBottom: spacing.md }}>
                Selecciona una sesión
              </h2>
              <p style={{ color: colors.text.tertiary, marginBottom: spacing.lg }}>
                O crea una nueva conversación para empezar
              </p>
              <GlassButton
                variant="primary"
                onClick={() => handleSlashCommand('new')}
              >
                ➕ Nueva sesión
              </GlassButton>
            </GlassCard>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: spacing.xl,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.lg,
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.info?.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: `${spacing.lg}`,
                      borderRadius: '12px',
                      background: msg.info?.role === 'user'
                        ? `linear-gradient(135deg, ${colors.primary.from}, ${colors.primary.to})`
                        : glassmorphism.glassElevated.background,
                      border: msg.info?.role === 'user'
                        ? 'none'
                        : `1px solid ${colors.border.light}`,
                      color: colors.text.primary,
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                    }}
                  >
                    <div className="markdown">
                      {msg.parts?.[0]?.text || ''}
                    </div>
                  </div>
                </div>
              ))}

              {streamingText && (
                <div style={{ display: 'flex' }}>
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: `${spacing.lg}`,
                      borderRadius: '12px',
                      background: glassmorphism.glassElevated.background,
                      border: `1px solid ${colors.border.light}`,
                      color: colors.text.primary,
                      fontSize: '0.95rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <div className="animate-pulse">●</div>
                      {streamingText}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEnd} />
            </div>

            {/* Command Suggestions */}
            {showCommands && filteredCommands.length > 0 && (
              <div style={{
                padding: spacing.lg,
                background: glassmorphism.glassElevated.background,
                borderTop: `1px solid ${colors.border.light}`,
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {filteredCommands.slice(0, 5).map((cmd, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: `${spacing.md} ${spacing.lg}`,
                      background: idx === cmdIndex ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      marginBottom: spacing.sm,
                    }}
                    onClick={() => setInput(`/${cmd.name} `)}
                  >
                    <div style={{ fontWeight: 600, color: colors.primary.light }}>
                      /{cmd.name}
                    </div>
                    <div style={{ color: colors.text.tertiary, fontSize: '0.8rem' }}>
                      {cmd.description}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div style={{
              padding: spacing.lg,
              background: glassmorphism.glass.background,
              backdropFilter: glassmorphism.glass.backdropFilter,
              borderTop: `1px solid ${colors.border.light}`,
            }}>
              <form
                onSubmit={handleSend}
                style={{
                  display: 'flex',
                  gap: spacing.lg,
                  alignItems: 'flex-end',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Escribe / para comandos, ! para sistema, o simplemente tu mensaje..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    updateCommandFilter(e.target.value);
                  }}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: `${spacing.md} ${spacing.lg}`,
                    background: colors.background.surface,
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: '8px',
                    color: colors.text.primary,
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleSend(e);
                    }
                  }}
                />
                <GlassButton
                  variant="primary"
                  disabled={sending || !input.trim()}
                  onClick={handleSend}
                >
                  {sending ? '📤 Enviando...' : '📤 Enviar'}
                </GlassButton>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
