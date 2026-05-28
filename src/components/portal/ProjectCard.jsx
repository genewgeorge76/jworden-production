import React from 'react';
import { MapPin, Calendar, Ruler, ChevronRight } from 'lucide-react';

const STATUS_STYLES = {
  scheduled: { bg: 'bg-primary/10', border: 'border-primary/40', text: 'text-primary', label: 'Scheduled' },
  in_progress: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400', label: 'In Progress' },
  completed: { bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-400', label: 'Completed' },
  cancelled: { bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground', label: 'Cancelled' },
};

export default function ProjectCard({ job, isActive, onSelect }) {
  const s = STATUS_STYLES[job.status] || STATUS_STYLES.scheduled;

  return (
    <button
      onClick={() => onSelect(job)}
      className={`w-full text-left p-5 border transition-all duration-200 ${
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40 bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-foreground text-base uppercase tracking-tight truncate">
            {job.title}
          </p>
          {job.address && (
            <p className="flex items-center gap-1.5 font-body text-muted-foreground text-xs mt-1.5 truncate">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{job.address}</span>
            </p>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-block px-2 py-0.5 border ${s.border} ${s.bg} ${s.text} font-display text-[10px] tracking-[0.2em] uppercase`}>
          {s.label}
        </span>
        {job.scheduled_date && (
          <span className="flex items-center gap-1 text-muted-foreground font-display text-[11px] tracking-wider uppercase">
            <Calendar className="w-3 h-3" />
            {new Date(job.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {job.sqft > 0 && (
          <span className="flex items-center gap-1 text-muted-foreground font-display text-[11px] tracking-wider uppercase">
            <Ruler className="w-3 h-3" />
            {Math.round(job.sqft).toLocaleString()} sq ft
          </span>
        )}
      </div>
    </button>
  );
}
