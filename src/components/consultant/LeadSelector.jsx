import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  new: 'text-primary',
  contacted: 'text-blue-400',
  quoted: 'text-yellow-400',
  won: 'text-green-400',
  lost: 'text-destructive',
};

export function LeadSelector({ leads, selectedLead, onSelect }) {
  if (leads.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="font-body text-muted-foreground text-sm">No leads yet.</p>
      </div>
    );
  }

  const sorted = [...leads].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
      {sorted.map((lead) => (
        <button
          key={lead.id}
          onClick={() => onSelect(lead)}
          className={cn(
            'w-full text-left px-5 py-4 border-b border-border transition-colors hover:bg-muted/50',
            selectedLead?.id === lead.id && 'bg-muted/80'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-display font-bold text-foreground text-sm tracking-wide truncate">
              {lead.name}
            </p>
            <span className={cn('font-display text-xs tracking-wider uppercase flex-shrink-0', STATUS_COLORS[lead.status])}>
              {lead.status}
            </span>
          </div>
          <p className="font-body text-muted-foreground text-xs mt-1 truncate">
            {lead.surface_type
              ? lead.surface_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : 'No surface type'}{' '}
            {lead.sqft ? `· ${Math.round(lead.sqft).toLocaleString()} sq ft` : ''}
          </p>
          {lead.phone && (
            <p className="font-body text-muted-foreground text-xs mt-0.5">{lead.phone}</p>
          )}
        </button>
      ))}
    </div>
  );
}
