import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Mail, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function EmailTimeline({ lead }) {
  const [comms, setComms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!lead?.id) return;
    setLoading(true);
    api.entities.LeadCommunication
      .filter({ lead_id: lead.id }, '-sent_at', 50)
      .then((data) => setComms(Array.isArray(data) ? data : []))
      .catch(() => setComms([]))
      .finally(() => setLoading(false));
  }, [lead?.id]);

  if (loading) {
    return (
      <div className="px-6 py-3 border-b border-border flex items-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading email history…
      </div>
    );
  }

  if (comms.length === 0) {
    return (
      <div className="px-6 py-3 border-b border-border flex items-center gap-2 text-muted-foreground text-xs">
        <Mail className="w-3 h-3" /> No email history with this lead yet
      </div>
    );
  }

  const visible = expanded ? comms : comms.slice(0, 3);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-foreground text-xs tracking-wider uppercase">
            Email Timeline ({comms.length})
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <div className="px-6 pb-3 space-y-1.5">
        {visible.map((c) => {
          const isInbound = c.channel === 'email_inbound';
          const Icon = isInbound ? ArrowDownLeft : ArrowUpRight;
          return (
            <div key={c.id} className="flex items-start gap-2 text-xs py-1.5 border-t border-border/50 first:border-t-0">
              <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isInbound ? 'text-green-400' : 'text-primary'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold text-foreground truncate">{c.subject || '(no subject)'}</span>
                  <span className="text-muted-foreground font-body text-[11px]">
                    {c.sent_at ? new Date(c.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
                {c.snippet && (
                  <p className="text-muted-foreground font-body text-[11px] truncate mt-0.5">{c.snippet}</p>
                )}
              </div>
            </div>
          );
        })}
        {!expanded && comms.length > 3 && (
          <p className="text-muted-foreground font-body text-[11px] italic pt-1">
            + {comms.length - 3} more — click to expand
          </p>
        )}
      </div>
    </div>
  );
}
