import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/client';

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
        const shellCmd = text.slice(1).trim();
        if (!shellCmd) throw new Error('Comando vacío');
        const result = await api.opencode.sendShell(activeId, shellCmd);
        setMessages(prev => [...prev, {
          info: { role: 'assistant' },
          parts: result?.parts || [{ type: 'text', text: result?.text || '✅ Ejecutado' }],
        }]);
      } else {
        const result = await api.opencode.sendMessage(activeId, text);
        setStreamingText('');
        setMessages(prev => [...prev, {
          info: { role: 'assistant' },
          parts: result?.parts || [{ type: 'text', text: result?.text || 'Sin respuesta' }],
        }]);
      }
    } catch (err) {
      setStreamingText('');
      setMessages(prev => [...prev, {
        info: { role: 'assistant' },
        parts: [{ type: 'text', text: `❌ Error: ${err.message}` }],
      }]);
    } finally {
      setSending(false);
    }
  }

  function selectCommand(cmd) {
    setInput(`/${cmd.name} `);
    setShowCommands(false);
    inputRef.current?.focus();
  }

  async function newSession() {
    const title = `Chat ${new Date().toLocaleString()}`;
    try {
      const session = await api.opencode.createSession(title);
      setSessions(prev => [session, ...prev]);
      setActiveId(session.id);
      setMessages([]);
      setStreamingText('');
    } catch {}
  }

  async function deleteSession(id) {
    try {
      await api.opencode.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {}
  }

  const filtered = sessions.filter(s =>
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  );

  function getMsgText(parts) {
    return parts?.map(p => {
      if (p.type === 'text') return p.text;
      if (p.type === 'tool_use') return `[🔧 ${p.name}]`;
      if (p.type === 'tool_result') return `[⚙️ Resultado]`;
      return `[${p.type}]`;
    }).filter(Boolean).join('\n') || '';
  }

  function renderParts(parts) {
    return parts?.map((p, i) => {
      if (p.type === 'text') return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{p.text}</span>;
      if (p.type === 'tool_use') {
        return (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.5rem', background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px',
            fontSize: '0.8rem', color: '#60a5fa', margin: '0.15rem 0',
          }}>
            🔧 {p.name}
          </div>
        );
      }
      if (p.type === 'tool_result') {
        return (
          <div key={i} style={{
            padding: '0.4rem 0.6rem', background: '#1e293b',
            borderLeft: '3px solid #60a5fa', borderRadius: '4px',
            fontSize: '0.85rem', margin: '0.25rem 0',
            color: '#94a3b8',
          }}>
            {p.result || p.text || ''}
          </div>
        );
      }
      return <span key={i} style={{ color: '#64748b' }}>[{p.type}]</span>;
    });
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{
        width: '280px', flexShrink: 0, borderRight: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column', background: '#0f172a',
      }}>
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #1e293b' }}>
          <button onClick={newSession} style={{
            width: '100%', padding: '0.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.85rem',
            fontWeight: 500, cursor: 'pointer', marginBottom: '0.5rem',
          }}>
            + Nuevo chat
          </button>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar sesiones..."
            style={{
              width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #1e293b',
              borderRadius: '6px', background: '#0f172a', color: '#94a3b8',
              fontSize: '0.8rem', outline: 'none',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              {search ? 'Sin resultados' : 'Sin sesiones'}
            </div>
          ) : filtered.map(s => (
            <div
              key={s.id}
              onClick={() => selectSession(s.id)}
              style={{
                padding: '0.55rem 0.6rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activeId === s.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: activeId === s.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                marginBottom: '2px',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: activeId === s.id ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title || 'Sin título'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                {s.id.substring(0, 10)}...
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeId ? (
          <>
            <div style={{
              flex: 1, overflowY: 'auto', padding: '1rem 1.5rem',
            }}>
              {messages.length === 0 && !streamingText ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: '#64748b',
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>💬</div>
                  <p style={{ fontSize: '0.95rem' }}>Envía un mensaje para empezar</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#475569' }}>
                    Escribe <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>/help</span> para ver comandos disponibles
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: msg.info?.role === 'assistant' ? 'flex-start' : 'flex-end',
                      marginBottom: '1rem',
                    }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: '0.75rem 1rem',
                        borderRadius: msg.info?.role === 'assistant'
                          ? '12px 12px 12px 4px'
                          : '12px 12px 4px 12px',
                        background: msg.info?.role === 'assistant'
                          ? 'rgba(30, 41, 59, 0.8)'
                          : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: msg.info?.role === 'assistant' ? '1px solid #1e293b' : 'none',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.info?.role === 'assistant' ? renderParts(msg.parts) : getMsgText(msg.parts)}
                      </div>
                    </div>
                  ))}
                  {streamingText && (
                    <div style={{
                      display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem',
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px 12px 12px 4px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid #1e293b',
                        fontSize: '0.9rem',
                        color: '#94a3b8',
                      }}>
                        <span style={{ display: 'inline-flex', gap: '0.2rem' }}>
                          {streamingText}
                          <span style={{ animation: 'pulse 1s infinite' }}>▊</span>
                        </span>
                        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
                      </div>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </>
              )}
            </div>

            <div style={{
              padding: '0.75rem 1.5rem 1rem',
              borderTop: '1px solid #1e293b',
            }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  {showCommands && filteredCommands.length > 0 && (
                    <div style={{
                      position: 'absolute', bottom: '100%', left: 0, right: 0,
                      marginBottom: '4px',
                      background: '#1e293b', border: '1px solid #334155',
                      borderRadius: '10px', overflow: 'hidden',
                      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
                      zIndex: 10, maxHeight: '220px', overflowY: 'auto',
                    }}>
                      {filteredCommands.map((c, i) => (
                        <div
                          key={c.name}
                          onClick={() => selectCommand(c)}
                          onMouseEnter={() => setCmdIndex(i)}
                          style={{
                            padding: '0.45rem 0.75rem',
                            cursor: 'pointer',
                            background: i === cmdIndex ? 'rgba(59,130,246,0.15)' : 'transparent',
                            borderBottom: i < filteredCommands.length - 1 ? '1px solid #0f172a' : 'none',
                            transition: 'background 0.1s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              /{c.name}
                            </span>
                            {c.aliases?.length > 0 && (
                              <span style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                ({c.aliases.map(a => '/' + a).join(', ')})
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                            {c.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => {
                      const val = e.target.value;
                      setInput(val);
                      updateCommandFilter(val);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (showCommands && filteredCommands[cmdIndex]) {
                          selectCommand(filteredCommands[cmdIndex]);
                        } else {
                          handleSend(e);
                        }
                        return;
                      }
                      if (showCommands) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setCmdIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setCmdIndex(i => Math.max(i - 1, 0));
                          return;
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setShowCommands(false);
                          return;
                        }
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          if (filteredCommands[cmdIndex]) {
                            selectCommand(filteredCommands[cmdIndex]);
                          }
                          return;
                        }
                      }
                    }}
                    placeholder='Escribe un mensaje... (/help para comandos, !cmd para shell)'
                    disabled={sending}
                    rows={1}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.9rem',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      background: '#0f172a',
                      color: '#f1f5f9',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'none',
                      minHeight: '42px',
                      maxHeight: '150px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => {
                      e.target.style.borderColor = '#334155';
                      setTimeout(() => setShowCommands(false), 200);
                    }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || !activeId || sending}
                  style={{
                    padding: '0.65rem 1.2rem',
                    background: input.trim() && !sending
                      ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                      : '#1e293b',
                    color: input.trim() && !sending ? '#fff' : '#475569',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    minHeight: '42px',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#64748b',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }}>💬</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '0.5rem', color: '#94a3b8' }}>
              OpenCode Chat
            </h2>
            <p style={{ fontSize: '0.9rem' }}>
              Selecciona una sesión o crea un nuevo chat
            </p>
            <button onClick={newSession} style={{
              marginTop: '1.5rem', padding: '0.6rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
            }}>
              + Nuevo chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
