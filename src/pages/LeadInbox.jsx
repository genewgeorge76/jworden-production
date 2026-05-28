import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Loader2, DollarSign, Sparkles, RefreshCw } from 'lucide-react';
import LeadScoreBadge from '@/components/LeadScoreBadge';

const TIER_ORDER = { hot: 0, warm: 1, cool: 2, cold: 3 };

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'hot', label: 'Hot' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'cold', label: 'Cold' },
  { id: 'unscored', label: 'Unscored' },
];

export default function LeadInbox() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rescoring, setRescoring] = useState(null);

  useEffect(() => {
    const load = async () => {
      const all = await api.entities.Lead.list('-created_date', 200);
      setLeads(Array.isArray(all) ? all : []);
      setLoading(false);
    };
    load();

    const unsubscribe = api.entities.Lead.subscribe((event) => {
      if (event.type === 'create') {
        setLeads((prev) => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setLeads((prev) => prev.map((l) => (l.id === event.id ? event.data : l)));
      } else if (event.type === 'delete') {
        setLeads((prev) => prev.filter((l) => l.id !== event.id));
      }
    });
    return unsubscribe;
  }, []);

  const sorted = useMemo(() => {
    const copy = [...leads];
    copy.sort((a, b) => {
      const ta = TIER_ORDER[a.score_tier] ?? 4;
      const tb = TIER_ORDER[b.score_tier] ?? 4;
      if (ta !== tb) return ta - tb;
      return (b.score || 0) - (a.score || 0);
    });
    return copy;
  }, [leads]);

  const filtered = useMemo(() => {
    if (filter === 'all') return sorted;
    if (filter === 'unscored') return sorted.filter((l) => l.score == null);
    return sorted.filter((l) => l.score_tier === filter);
  }, [sorted, filter]);

  const counts = useMemo(() => {
    const c = { hot: 0, warm: 0, cool: 0, cold: 0, unscored: 0 };
    leads.forEach((l) => {
      if (l.score == null) c.unscored += 1;
      else if (l.score_tier && c[l.score_tier] != null) c[l.score_tier] += 1;
    });
    return c;
  }, [leads]);

  const totalValue = useMemo(() => {
    return leads
      .filter((l) => ['hot', 'warm'].includes(l.score_tier) && l.status !== 'lost' && l.status !== 'won')
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [leads]);

  const rescore = async (lead) => {
    setRescoring(lead.id);
    try {
      await api.functions.invoke('scoreNewLead', { data: lead, event: { entity_id: lead.id } });
    } finally {
      setRescoring(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">AI Priority Inbox</p>
            </div>
            <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">
              Lead Scoring
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {leads.length} total leads · Claude Sonnet scores every new inquiry by close probability + project value
            </p>
          </div>
          <div className="border border-primary/30 bg-primary/5 px-5 py-3">
            <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
              Active Pipeline Value
            </p>
            <p className="font-display font-black text-primary text-2xl">
              ${totalValue.toLocaleString()}
            </p>
            <p className="font-body text-muted-foreground text-[11px] mt-0.5">
              Hot + Warm, excl. won/lost
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const count = f.id === 'all' ? leads.length : counts[f.id] || 0;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 border font-display font-bold text-xs tracking-[0.2em] uppercase transition-all min-h-[40px] flex items-center gap-2 ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {f.label}
                <span className={`text-[10px] ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border">
            <p className="font-display text-muted-foreground text-sm tracking-wider uppercase">
              No leads in this view
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((lead) => (
              <div
                key={lead.id}
                className={`border bg-card p-5 transition-all hover:border-primary/40 ${
                  lead.score_tier === 'hot' ? 'border-red-500/40' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <LeadScoreBadge score={lead.score} tier={lead.score_tier} size="md" />
                      <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight">
                        {lead.name || 'Unknown'}
                      </h3>
                      {lead.estimated_value ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 border border-primary/30 bg-primary/5 text-primary font-display font-bold text-[11px] tracking-wider uppercase">
                          <DollarSign className="w-3 h-3" />
                          {lead.estimated_value.toLocaleString()}
                        </span>
                      ) : null}
                      {lead.gross_margin_band ? (
                        <span className={`px-2 py-0.5 border font-display font-bold text-[10px] tracking-wider uppercase ${
                          lead.gross_margin_band === 'high'
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                            : lead.gross_margin_band === 'medium'
                              ? 'border-sky-400/40 bg-sky-500/10 text-sky-300'
                              : 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                        }`}>
                          {lead.gross_margin_band} margin
                        </span>
                      ) : null}
                      <span className="px-2 py-0.5 border border-border text-muted-foreground font-display text-[10px] tracking-[0.2em] uppercase">
                        {lead.status || 'new'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground mb-3">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-primary">
                          <Phone className="w-3.5 h-3.5" /> {lead.phone}
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-primary">
                          <Mail className="w-3.5 h-3.5" /> {lead.email}
                        </a>
                      )}
                      {lead.address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {lead.address}
                        </span>
                      )}
                      {lead.created_date && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(lead.created_date).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {lead.surface_type && (
                        <span className="px-2 py-0.5 bg-muted text-foreground font-display text-[10px] tracking-wider uppercase">
                          {lead.surface_type.replace(/_/g, ' ')}
                        </span>
                      )}
                      {lead.sqft ? (
                        <span className="px-2 py-0.5 bg-muted text-foreground font-display text-[10px] tracking-wider uppercase">
                          {Math.round(lead.sqft).toLocaleString()} sqft
                        </span>
                      ) : null}
                      {lead.urgency && (
                        <span className={`px-2 py-0.5 font-display text-[10px] tracking-wider uppercase ${
                          lead.urgency === 'urgent' ? 'bg-red-500/15 text-red-400' :
                          lead.urgency === 'standard' ? 'bg-primary/15 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {lead.urgency}
                        </span>
                      )}
                    </div>

                    {lead.score_reasoning && (
                      <div className="border-l-2 border-primary/40 pl-3 mt-3">
                        <p className="font-display text-primary text-[9px] tracking-[0.3em] uppercase mb-1">
                          AI Reasoning
                        </p>
                        <p className="font-body text-muted-foreground text-sm leading-relaxed">
                          {lead.score_reasoning}
                        </p>
                        {lead.expected_gross_profit ? (
                          <p className="font-body text-emerald-300 text-xs mt-2">
                            Expected gross profit: ${Math.round(lead.expected_gross_profit).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {lead.notes && (
                      <p className="font-body text-muted-foreground text-xs italic mt-2 border-t border-border pt-2">
                        Customer notes: {lead.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-display font-bold text-xs tracking-wider uppercase hover:bg-primary/90"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Now
                      </a>
                    )}
                    <button
                      onClick={() => navigate(`/consultant?leadId=${lead.id}`)}
                      className="border border-border text-foreground px-4 py-2 font-display font-bold text-xs tracking-wider uppercase hover:border-primary hover:text-primary"
                    >
                      AI Consult
                    </button>
                    <button
                      onClick={() => rescore(lead)}
                      disabled={rescoring === lead.id}
                      className="flex items-center justify-center gap-1.5 border border-border text-muted-foreground px-4 py-2 font-display font-bold text-[10px] tracking-wider uppercase hover:border-primary/40 hover:text-primary disabled:opacity-50"
                    >
                      {rescoring === lead.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      {lead.score == null ? 'Score' : 'Rescore'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
