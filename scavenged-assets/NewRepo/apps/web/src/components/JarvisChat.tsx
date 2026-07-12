import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap } from 'lucide-react';
import { BUSINESS_SHORT } from '@jworden/core';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'How much does asphalt paving cost per sq ft?',
  'Do you pave commercial parking lots?',
  "What's the difference between sealcoating and crack filling?",
  'Do you offer financing?',
];

export function JarvisChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi, I'm Jarvis — the ${BUSINESS_SHORT} AI assistant. I can answer questions about asphalt paving, give you rough pricing, or help you get a formal estimate. What do you need?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');

    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch('/.netlify/functions/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? 'Sorry, I hit an error. Please call us directly.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Network error. Please call us directly.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="w-6 h-6 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center justify-center">
          <Zap size={12} className="text-yellow-400" />
        </div>
        <span className="text-white text-sm font-semibold">Jarvis</span>
        <span className="text-zinc-500 text-xs ml-auto">Powered by Claude</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-zinc-200'
                : 'bg-zinc-800/80 text-zinc-200'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/80 px-3.5 py-2.5 rounded-xl">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starters */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-zinc-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about paving, pricing, services…"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-lg p-2 transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
