import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import {
  Bot,
  Send,
  Mic,
  MicOff,
  RotateCw,
  ArrowLeft,
  Trash2,
  Copy,
  CheckCheck,
  MessageSquare,
  Plus,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const PERSONAS = {
  JARVIS: {
    label: 'JARVIS',
    color: '#f59e0b',
    accent: '#f59e0b20',
    border: '#f59e0b40',
    system: 'You are Jarvis, a sharp AI assistant for J. Worden & Sons Asphalt Paving. Be direct and precise. Focus on business decisions, lead management, pricing, and field operations. Keep responses concise and actionable.',
  },
  ANGELIC: {
    label: 'ANGELIC',
    color: '#a78bfa',
    accent: '#a78bfa20',
    border: '#a78bfa40',
    system: 'You are Angelic, a professional and warm AI assistant for J. Worden & Sons. Help with customer communications, proposal writing, and relationship management. Be professional, empathetic, and persuasive.',
  },
}

const QUICK_ACTIONS = [
  { label: '📋 Check lead status', prompt: 'Summarize the current lead pipeline status. How many leads do we have and what are the hot ones to call today?' },
  { label: '📧 Draft follow-up email', prompt: 'Draft a professional follow-up email to a warm lead who requested an estimate for asphalt paving 3 days ago. Keep it friendly but direct.' },
  { label: '💰 VA paving prices', prompt: 'What are current market rates for asphalt paving per square foot in Virginia? Include both residential and commercial ranges.' },
  { label: '⚙️ Sealcoating tips', prompt: 'What are the key factors that affect sealcoating quality and price? Give me a practical checklist for field estimates.' },
  { label: '🌡️ Weather impact', prompt: 'How does weather affect asphalt paving and sealcoating operations? What temperature ranges are ideal vs. problematic?' },
  { label: '📝 Proposal template', prompt: 'Draft a professional proposal template for a residential driveway replacement project. Include scope, materials, timeline, and payment terms sections.' },
]

const STORAGE_KEY = 'jarvis.conversations'

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadConversations() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveConversations(convos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.slice(0, 20)))
  } catch { /* ignore */ }
}

function newConversation() {
  return { id: 'conv-' + Date.now(), title: 'New conversation', messages: [], createdAt: new Date().toISOString() }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Message Component ─────────────────────────────────────────────────────────

function Message({ msg, persona }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'
  const personaConfig = PERSONAS[persona] || PERSONAS.JARVIS

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 12,
      alignItems: 'flex-start',
      maxWidth: '90%',
      ...(isUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }),
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, flexShrink: 0,
        borderRadius: 10,
        background: isUser ? '#1e293b' : personaConfig.accent,
        border: `1px solid ${isUser ? '#334155' : personaConfig.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
      }}>
        {isUser ? (
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b', fontWeight: 700 }}>YOU</span>
        ) : (
          <Bot size={15} color={personaConfig.color} />
        )}
      </div>

      {/* Bubble */}
      <div style={{
        background: isUser ? '#0f172a' : '#0a0f1e',
        border: `1px solid ${isUser ? '#1e293b' : personaConfig.border + '50'}`,
        borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
        padding: '12px 16px',
        position: 'relative',
        maxWidth: '100%',
      }}>
        {!isUser && (
          <div style={{
            fontFamily: 'monospace', fontSize: 10, color: personaConfig.color,
            letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6,
          }}>
            {personaConfig.label}
          </div>
        )}
        <div style={{
          color: isUser ? '#fbbf24' : '#e2e8f0',
          fontSize: 14, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 8,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#334155' }}>
            {formatTime(msg.ts)}
          </span>
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: copied ? '#22c55e' : '#334155',
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 6px', borderRadius: 4, fontSize: 11,
                transition: 'color 0.15s',
              }}
            >
              {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Thinking Indicator ────────────────────────────────────────────────────────

function ThinkingIndicator({ persona }) {
  const personaConfig = PERSONAS[persona] || PERSONAS.JARVIS
  return (
    <div style={{
      alignSelf: 'flex-start', display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{
        width: 32, height: 32,
        background: personaConfig.accent,
        border: `1px solid ${personaConfig.border}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={15} color={personaConfig.color} />
      </div>
      <div style={{
        background: '#0a0f1e', border: `1px solid ${personaConfig.border}50`,
        borderRadius: '16px 16px 16px 2px',
        padding: '14px 18px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, background: personaConfig.color,
            borderRadius: '50%',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  const grouped = conversations.reduce((acc, conv) => {
    const date = formatDate(conv.createdAt)
    if (!acc[date]) acc[date] = []
    acc[date].push(conv)
    return acc
  }, {})

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: '#060a14',
      borderRight: '1px solid #0f172a',
      display: 'flex', flexDirection: 'column',
      overflowY: 'hidden',
    }}>
      <div style={{ padding: '16px 12px 12px' }}>
        <button
          type="button"
          onClick={onNew}
          style={{
            width: '100%', background: '#0a0f1e',
            border: '1px solid #1e293b', borderRadius: 10,
            padding: '8px 12px',
            color: '#94a3b8', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b40'; e.currentTarget.style.color = '#f59e0b' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8' }}
        >
          <Plus size={14} /> New Chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
        {Object.entries(grouped).map(([date, convs]) => (
          <div key={date} style={{ marginBottom: 12 }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, color: '#334155',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '4px 8px 6px',
            }}>{date}</div>
            {convs.map(conv => (
              <div key={conv.id} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: activeId === conv.id ? '#0f172a' : 'none',
                    border: `1px solid ${activeId === conv.id ? '#1e293b' : 'transparent'}`,
                    borderRadius: 8, padding: '7px 32px 7px 10px',
                    color: activeId === conv.id ? 'white' : '#64748b',
                    fontSize: 12, cursor: 'pointer', lineHeight: 1.4,
                    transition: 'all 0.15s', wordBreak: 'break-word',
                  }}
                  onMouseEnter={e => { if (activeId !== conv.id) e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { if (activeId !== conv.id) e.currentTarget.style.color = '#64748b' }}
                >
                  <MessageSquare size={11} style={{ marginRight: 6, opacity: 0.5 }} />
                  {conv.title}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conv.id)}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#334155', padding: 4, borderRadius: 4,
                    opacity: 0, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        ))}
        {conversations.length === 0 && (
          <div style={{ color: '#334155', fontSize: 12, textAlign: 'center', padding: '24px 12px', fontFamily: 'monospace' }}>
            No conversations yet
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main JarvisPage ───────────────────────────────────────────────────────────

export default function JarvisPage() {
  const [persona, setPersona] = useState('JARVIS')
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Load conversations on mount
  useEffect(() => {
    const saved = loadConversations()
    if (saved.length > 0) {
      setConversations(saved)
      setActiveId(saved[0].id)
    } else {
      const first = newConversation()
      setConversations([first])
      setActiveId(first.id)
    }
  }, [])

  const activeConv = conversations.find(c => c.id === activeId) || null

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages?.length, thinking])

  // Persist on change
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations)
  }, [conversations])

  const updateConversation = useCallback((id, updater) => {
    setConversations(prev => prev.map(c => c.id === id ? updater(c) : c))
  }, [])

  const addMessage = useCallback((convId, message) => {
    updateConversation(convId, conv => {
      const messages = [...conv.messages, message]
      const title = conv.messages.length === 0 && message.role === 'user'
        ? message.text.slice(0, 40) + (message.text.length > 40 ? '…' : '')
        : conv.title
      return { ...conv, messages, title }
    })
  }, [updateConversation])

  const handleNew = useCallback(() => {
    const conv = newConversation()
    setConversations(prev => [conv, ...prev])
    setActiveId(conv.id)
    inputRef.current?.focus()
  }, [])

  const handleDelete = useCallback((id) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id)
      if (id === activeId) setActiveId(next[0]?.id || null)
      return next.length > 0 ? next : [newConversation()]
    })
  }, [activeId])

  const handleSelect = useCallback((id) => {
    setActiveId(id)
    inputRef.current?.focus()
  }, [])

  const send = useCallback(async (text) => {
    if (!activeId) return
    const msg = (text || input).trim()
    if (!msg || thinking) return
    setInput('')

    const userMessage = { role: 'user', text: msg, ts: new Date().toISOString() }
    addMessage(activeId, userMessage)
    setThinking(true)

    try {
      let reply = null
      const personaConfig = PERSONAS[persona]
      const fullMsg = personaConfig.system + '\n\nUser: ' + msg

      try {
        const r = await api.jarvisCommand(fullMsg, persona)
        reply = r?.response || r?.reply || r?.message || r?.answer
      } catch {
        try {
          const r2 = await api.publicChat({ message: msg, session_id: activeId })
          reply = r2?.response || r2?.reply || r2?.message
        } catch { /* both failed */ }
      }

      const botMessage = {
        role: 'jarvis',
        text: reply || 'I\'m having trouble connecting right now. Please try again.',
        ts: new Date().toISOString(),
        persona,
      }
      addMessage(activeId, botMessage)
    } catch {
      addMessage(activeId, {
        role: 'jarvis',
        text: 'Connection error. Please check the backend and try again.',
        ts: new Date().toISOString(),
        persona,
      })
    }
    setThinking(false)
  }, [activeId, input, thinking, persona, addMessage])

  // Voice input
  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [listening])

  const personaConfig = PERSONAS[persona]

  return (
    <div style={{
      height: '100vh',
      background: '#050810',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes listening-pulse {
          0%, 100% { box-shadow: 0 0 0 0 #ef444440; }
          50% { box-shadow: 0 0 0 8px transparent; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{
        height: 56, background: '#060a14',
        borderBottom: '1px solid #0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/command-center" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#64748b', textDecoration: 'none', fontSize: 13,
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={16} /> Cockpit
          </Link>
          <span style={{ color: '#1e293b' }}>|</span>
          <div style={{
            width: 32, height: 32,
            background: personaConfig.accent,
            border: `1px solid ${personaConfig.border}`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={17} color={personaConfig.color} />
          </div>
          <span style={{
            fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
            color: personaConfig.color, letterSpacing: '0.15em',
          }}>
            {personaConfig.label}
          </span>
        </div>

        {/* Persona Toggle */}
        <div style={{
          display: 'flex',
          background: '#0a0f1e',
          border: '1px solid #1e293b',
          borderRadius: 20,
          padding: 3,
        }}>
          {Object.entries(PERSONAS).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPersona(key)}
              style={{
                background: persona === key ? config.accent : 'none',
                border: persona === key ? `1px solid ${config.border}` : '1px solid transparent',
                borderRadius: 16, padding: '4px 14px',
                color: persona === key ? config.color : '#475569',
                fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        {sidebarOpen && (
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        )}

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {/* Quick chips when empty */}
            {(!activeConv?.messages || activeConv.messages.length === 0) && (
              <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 600 }}>
                <div style={{
                  width: 64, height: 64,
                  background: personaConfig.accent,
                  border: `2px solid ${personaConfig.border}`,
                  borderRadius: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <Bot size={32} color={personaConfig.color} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                  {personaConfig.label}
                </h2>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                  {persona === 'JARVIS'
                    ? 'Your operations AI. Ask about leads, pricing, scheduling, or anything business-critical.'
                    : 'Your communications AI. Perfect for drafting proposals, emails, and customer messages.'}
                </p>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
                }}>
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => send(action.prompt)}
                      style={{
                        background: '#0a0f1e',
                        border: '1px solid #1e293b',
                        borderRadius: 20,
                        padding: '8px 14px',
                        color: '#94a3b8', fontSize: 13,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = personaConfig.border
                        e.currentTarget.style.color = personaConfig.color
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#1e293b'
                        e.currentTarget.style.color = '#94a3b8'
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {activeConv?.messages?.map((msg, i) => (
              <Message key={i} msg={msg} persona={msg.persona || persona} />
            ))}

            {thinking && <ThinkingIndicator persona={persona} />}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            borderTop: '1px solid #0f172a',
            background: '#060a14',
            padding: '16px 24px',
            flexShrink: 0,
          }}>
            <div style={{
              maxWidth: 800, margin: '0 auto',
              display: 'flex', gap: 10, alignItems: 'flex-end',
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                  }}
                  placeholder={`Message ${personaConfig.label}… (Enter to send, Shift+Enter for new line)`}
                  rows={1}
                  style={{
                    width: '100%',
                    background: '#0a0f1e',
                    border: `1px solid ${input ? personaConfig.border + '60' : '#1e293b'}`,
                    borderRadius: 14,
                    padding: '12px 16px',
                    color: 'white', fontSize: 14,
                    resize: 'none', outline: 'none',
                    fontFamily: 'inherit',
                    maxHeight: 160, overflowY: 'auto',
                    lineHeight: 1.5,
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={toggleVoice}
                style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: listening ? '#ef444420' : '#0a0f1e',
                  border: `1px solid ${listening ? '#ef4444' : '#1e293b'}`,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  animation: listening ? 'listening-pulse 1.5s ease-in-out infinite' : 'none',
                }}
              >
                {listening ? <MicOff size={18} color='#ef4444' /> : <Mic size={18} color='#64748b' />}
              </button>

              <button
                type="button"
                onClick={() => send()}
                disabled={thinking || !input.trim()}
                style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: thinking || !input.trim() ? '#1e293b' : personaConfig.color,
                  border: 'none', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {thinking
                  ? <RotateCw size={18} color='#475569' style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={18} color={thinking || !input.trim() ? '#475569' : '#000'} />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
