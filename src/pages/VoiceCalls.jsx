import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/client';
import { Phone, PhoneIncoming, PhoneMissed, Voicemail, Loader2, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

const INTENT_LABELS = {
  new_quote: { label: 'New Quote', color: 'text-primary bg-primary/10 border-primary/30' },
  existing_customer: { label: 'Existing Customer', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  scheduling: { label: 'Scheduling', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  complaint: { label: 'Complaint', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  general_inquiry: { label: 'Inquiry', color: 'text-muted-foreground bg-muted border-border' },
  voicemail: { label: 'Voicemail', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  other: { label: 'Other', color: 'text-muted-foreground bg-muted border-border' },
};

const STATUS_ICONS = {
  completed: { Icon: PhoneIncoming, className: 'text-primary' },
  missed: { Icon: PhoneMissed, className: 'text-red-400' },
  voicemail: { Icon: Voicemail, className: 'text-amber-400' },
  failed: { Icon: PhoneMissed, className: 'text-muted-foreground' },
  in_progress: { Icon: Phone, className: 'text-sky-400 animate-pulse' },
};

const fmtDuration = (s) => {
  if (!s) return '0s';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

export default function VoiceCalls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.entities.VoiceCall.list('-started_at', 100)
      .then((data) => {
        setCalls(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const unsub = api.entities.VoiceCall.subscribe((event) => {
      if (event.type === 'create') setCalls((prev) => [event.data, ...prev]);
      else if (event.type === 'update') setCalls((prev) => prev.map((c) => (c.id === event.id ? event.data : c)));
      else if (event.type === 'delete') setCalls((prev) => prev.filter((c) => c.id !== event.id));
    });
    return unsub;
  }, []);

  const stats = useMemo(() => {
    const total = calls.length;
    const booked = calls.filter((c) => c.booked_site_visit).length;
    const missed = calls.filter((c) => c.status === 'missed' || c.status === 'voicemail').length;
    const avgDuration = total
      ? Math.round(calls.reduce((s, c) => s + (c.duration_seconds || 0), 0) / total)
      : 0;
    return { total, booked, missed, avgDuration };
  }, [calls]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-primary" />
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">AI Voice Agent</p>
          </div>
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">
            Call Log
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            24/7 AI receptionist — books site visits, captures leads, routes urgent callers.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Calls', value: stats.total, color: 'text-foreground' },
            { label: 'Visits Booked', value: stats.booked, color: 'text-primary' },
            { label: 'Missed/VM', value: stats.missed, color: 'text-red-400' },
            { label: 'Avg Duration', value: fmtDuration(stats.avgDuration), color: 'text-foreground' },
          ].map((s) => (
            <div key={s.label} className="border border-border bg-card p-4">
              <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                {s.label}
              </p>
              <p className={`font-display font-black text-2xl mt-2 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border">
            <Phone className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-display text-muted-foreground text-sm tracking-wider uppercase mb-2">
              No Voice Calls Yet
            </p>
            <p className="font-body text-muted-foreground text-sm max-w-md mx-auto">
              Connect your Vapi.ai phone number to start receiving AI-handled calls. See setup instructions below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
            {/* Call list */}
            <div className="space-y-2">
              {calls.map((call) => {
                const { Icon, className } = STATUS_ICONS[call.status] || STATUS_ICONS.completed;
                const intent = INTENT_LABELS[call.intent] || INTENT_LABELS.other;
                const active = selected?.id === call.id;
                return (
                  <button
                    key={call.id}
                    onClick={() => setSelected(call)}
                    className={`w-full text-left border p-4 transition-all ${
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${className}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                          <p className="font-display font-bold text-foreground text-base tracking-wide">
                            {call.from_number}
                          </p>
                          <span className="text-muted-foreground text-xs">{fmtTime(call.started_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`px-2 py-0.5 border font-display text-[10px] tracking-[0.2em] uppercase ${intent.color}`}>
                            {intent.label}
                          </span>
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmtDuration(call.duration_seconds)}
                          </span>
                          {call.booked_site_visit && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 font-display text-[10px] tracking-[0.2em] uppercase">
                              <CheckCircle2 className="w-3 h-3" /> Booked
                            </span>
                          )}
                        </div>
                        {call.summary && (
                          <p className="font-body text-muted-foreground text-sm line-clamp-2">{call.summary}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail pane */}
            <aside className="border border-border bg-card p-6 h-fit sticky top-6">
              {selected ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase">Call Detail</p>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-muted-foreground hover:text-foreground text-xs font-display tracking-wider uppercase"
                    >
                      Close
                    </button>
                  </div>
                  <p className="font-display font-black text-foreground text-xl mb-1">
                    {selected.from_number}
                  </p>
                  <p className="text-muted-foreground text-xs mb-4">
                    {fmtTime(selected.started_at)} · {fmtDuration(selected.duration_seconds)}
                  </p>

                  {selected.recording_url && (
                    <a
                      href={selected.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 mb-4 px-3 py-2 border border-primary/30 bg-primary/5 text-primary font-display font-bold text-xs tracking-wider uppercase hover:bg-primary/10"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Listen to Recording
                    </a>
                  )}

                  {selected.summary && (
                    <div className="mb-4">
                      <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-2">
                        AI Summary
                      </p>
                      <p className="font-body text-foreground text-sm leading-relaxed">
                        {selected.summary}
                      </p>
                    </div>
                  )}

                  {selected.transcript && (
                    <div>
                      <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-2">
                        Transcript
                      </p>
                      <div className="max-h-96 overflow-y-auto border border-border bg-muted p-3 text-xs font-body text-foreground whitespace-pre-wrap leading-relaxed">
                        {selected.transcript}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Phone className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="font-display text-muted-foreground text-xs tracking-wider uppercase">
                    Select a call to view details
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Setup guide */}
        <div className="mt-10 border border-border bg-card p-6">
          <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-3">
            Voice Agent Setup
          </p>
          <h2 className="font-display font-black text-foreground text-xl uppercase tracking-tight mb-4">
            Activate Your 24/7 AI Receptionist
          </h2>
          <ol className="space-y-3 font-body text-foreground text-sm list-decimal list-inside">
            <li>
              Sign up at <a className="text-primary underline" href="https://vapi.ai" target="_blank" rel="noopener noreferrer">vapi.ai</a> — about $0.07/min inclusive of voice, STT, LLM.
            </li>
            <li>
              Create an assistant using the J. Worden prompt (we can export it — just ask).
            </li>
            <li>
              Purchase a Vapi phone number or forward your existing (804) 446-1296 line to it.
            </li>
            <li>
              In the assistant's <strong>Server URL</strong>, paste the webhook URL of the <code className="px-1 py-0.5 bg-muted text-primary rounded">vapiWebhook</code> backend function.
            </li>
            <li>
              Add three tools to the assistant: <code className="bg-muted px-1">check_calendar_availability</code>, <code className="bg-muted px-1">book_site_visit</code>, <code className="bg-muted px-1">create_lead</code>. Each posts to the same Server URL.
            </li>
            <li>
              Set <code className="bg-muted px-1">VAPI_WEBHOOK_SECRET</code> in your Base44 secrets and configure Vapi to send it as the <code>x-vapi-secret</code> header.
            </li>
          </ol>
          <p className="font-body text-muted-foreground text-xs mt-4 italic">
            Once live, every inbound call is transcribed, summarized, scored for intent, and logged here in real time. Calls where the agent books a visit create Lead + Calendar entries automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

