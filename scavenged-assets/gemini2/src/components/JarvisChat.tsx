/**
 * JarvisChat — floating concierge chat for J. Worden & Sons.
 *
 * Wires the public site to the FastAPI ops backend at /api/v1/public/chat.
 * - Endpoint base: VITE_AI_CHAT_URL (preferred) -> VITE_LEADS_API_URL host -> Railway fallback
 * - Persists session_id in sessionStorage so multi-turn context survives nav
 * - Renders quick_replies as clickable chips, surfaces handoff CTAs (form/call)
 * - Accessible: aria-live updates, ESC to close, focus on open
 * - Lazy-mounted from __root.tsx after first idle; trivial bundle weight
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Sentry } from '@/lib/sentry';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/businessInfo';

type Role = 'user' | 'assistant' | 'system';

interface Message {
  id: string;
  role: Role;
  text: string;
  quick_replies?: string[];
  handoff?: 'form' | 'call' | null;
  ts: number;
}

interface ChatResponse {
  message?: string;
  answer?: string;
  quick_replies?: string[];
  handoff?: 'form' | 'call' | null;
  session_id?: string;
  estimate?: unknown;
  lead_score?: unknown;
}

const SESSION_KEY = 'jworden.jarvis.session';
const HISTORY_KEY = 'jworden.jarvis.history';
const ENDPOINT_FALLBACK = 'https://codexbuildfreeofbase44-production.up.railway.app';

function resolveEndpoint(): string {
  const explicit = (import.meta.env.VITE_AI_CHAT_URL as string | undefined)?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const leads = (import.meta.env.VITE_LEADS_API_URL as string | undefined)?.trim();
  if (leads) {
    try {
      const u = new URL(leads);
      return `${u.origin}/api/v1/public/chat`;
    } catch {
      // fall through
    }
  }
  return `${ENDPOINT_FALLBACK}/api/v1/public/chat`;
}

function loadSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
  } catch {
    // sessionStorage may be blocked
  }
  const fresh = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    sessionStorage.setItem(SESSION_KEY, fresh);
  } catch {
    // ignore
  }
  return fresh;
}

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-30);
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    // ignore
  }
}

const GREETING: Message = {
  id: 'jarvis-greeting',
  role: 'assistant',
  text:
    "Hey, I'm Jarvis — J. Worden & Sons' AI concierge. Ask me about driveway pricing, sealcoating, scheduling, or get an instant estimate.",
  quick_replies: [
    'Driveway pricing in Chester',
    'Book a free estimate',
    'Do you sealcoat?',
    'Commercial paving timeline',
  ],
  handoff: null,
  ts: Date.now(),
};

export default function JarvisChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const restored = loadHistory();
    return restored.length ? restored : [GREETING];
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const sessionId = useMemo(() => loadSessionId(), []);
  const endpoint = useMemo(() => resolveEndpoint(), []);
  const location = useLocation();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      setError(null);
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setBusy(true);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 25_000);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            session_id: sessionId,
            page_context: location.pathname || '/',
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Chat backend ${res.status}`);
        }
        const data = (await res.json()) as ChatResponse;
        const reply = (data.message ?? data.answer ?? '').toString().trim();
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: reply || "I'm here — could you rephrase that?",
          quick_replies: Array.isArray(data.quick_replies) ? data.quick_replies.slice(0, 4) : undefined,
          handoff: data.handoff ?? null,
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (!open) setUnread((n) => n + 1);
      } catch (err) {
        Sentry.captureException(err, { tags: { surface: 'jarvis-chat' } });
        setError(
          'Connection hiccup — try again, or call us at ' + PHONE_DISPLAY + '.',
        );
      } finally {
        window.clearTimeout(timeout);
        setBusy(false);
      }
    },
    [busy, endpoint, location.pathname, open, sessionId],
  );

  const handleQuickReply = (text: string) => {
    void send(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const showCallCta = lastAssistant?.handoff === 'call';
  const showFormCta = lastAssistant?.handoff === 'form';

  return (
    <>
      {/* Floating Action Button */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="jarvis-chat-panel"
        aria-label={open ? 'Close Jarvis chat' : 'Open Jarvis chat'}
        data-testid="jarvis-fab"
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full border border-[#ffcc00]/40 bg-zinc-950/95 px-4 py-3 text-sm font-semibold text-[#ffcc00] shadow-[0_8px_30px_rgba(0,0,0,0.55)] backdrop-blur transition-all hover:border-[#ffcc00] hover:shadow-[0_10px_40px_rgba(255,204,0,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc00] sm:bottom-6 sm:right-6"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
        />
        <span>{open ? 'Close' : 'Ask Jarvis'}</span>
        {!open && unread > 0 && (
          <span
            aria-label={`${unread} new message${unread === 1 ? '' : 's'}`}
            className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#ffcc00] px-1.5 text-xs font-bold text-zinc-950"
          >
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          id="jarvis-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Jarvis concierge chat"
          data-testid="jarvis-panel"
          className="fixed inset-x-3 bottom-24 z-[59] flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/97 text-white shadow-[0_25px_80px_rgba(0,0,0,0.7)] backdrop-blur sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffcc00]/60 bg-zinc-900 text-[#ffcc00] font-bold">
                J
              </div>
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-emerald-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold tracking-wide text-white">Jarvis · J. Worden Concierge</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                Online · replies in seconds
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1 text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc00]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#ffcc00] px-3.5 py-2.5 text-sm text-zinc-950 shadow'
                    : 'mr-auto max-w-[90%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-100'
                }
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                {m.role === 'assistant' && m.quick_replies && m.quick_replies.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.quick_replies.map((qr, idx) => (
                      <button
                        key={`${m.id}-qr-${idx}`}
                        type="button"
                        onClick={() => handleQuickReply(qr)}
                        disabled={busy}
                        className="rounded-full border border-[#ffcc00]/40 bg-zinc-950/60 px-3 py-1 text-xs font-medium text-[#ffcc00] transition-colors hover:border-[#ffcc00] hover:bg-[#ffcc00]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="mr-auto inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ffcc00]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ffcc00] [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ffcc00] [animation-delay:240ms]" />
                <span className="sr-only">Jarvis is typing</span>
              </div>
            )}
          </div>

          {/* Handoff CTAs */}
          {(showCallCta || showFormCta) && (
            <div className="flex gap-2 border-t border-zinc-800/80 bg-zinc-950 px-4 py-2.5">
              {showFormCta && (
                <a
                  href="/estimate"
                  className="flex-1 rounded-md bg-[#ffcc00] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-zinc-950 transition-colors hover:bg-yellow-400"
                >
                  Free Estimate
                </a>
              )}
              <a
                href={PHONE_HREF}
                className="flex-1 rounded-md border border-[#ffcc00]/60 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#ffcc00] transition-colors hover:border-[#ffcc00] hover:bg-[#ffcc00]/10"
              >
                Call {PHONE_DISPLAY}
              </a>
            </div>
          )}

          {error && (
            <div role="alert" className="border-t border-red-900/50 bg-red-950/60 px-4 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-zinc-800/80 bg-zinc-950 px-3 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask about pricing, scheduling, sealcoating…"
              aria-label="Type your question"
              data-testid="jarvis-input"
              disabled={busy}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#ffcc00] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              data-testid="jarvis-send"
              className="rounded-lg bg-[#ffcc00] px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-950 transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>

          <div className="border-t border-zinc-900 bg-zinc-950 px-4 py-1.5 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-200">
            Powered by JWORDENAI · Replies are AI-generated
          </div>
        </div>
      )}
    </>
  );
}
