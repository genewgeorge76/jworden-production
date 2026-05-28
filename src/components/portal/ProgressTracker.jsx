import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const STAGES = [
  { key: 'scheduled', label: 'Scheduled', minPercent: 0 },
  { key: 'prep', label: 'Site Prep', minPercent: 15 },
  { key: 'base', label: 'Base Course', minPercent: 40 },
  { key: 'surface', label: 'Surface Lift', minPercent: 70 },
  { key: 'completed', label: 'Completed', minPercent: 100 },
];

export default function ProgressTracker({ job }) {
  const percent = job.status === 'completed' ? 100 : (job.progress_percent || 0);
  const isCancelled = job.status === 'cancelled';

  return (
    <div className="border border-border bg-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-1">Project Progress</p>
          <p className="font-display font-black text-foreground text-3xl">
            {isCancelled ? '—' : `${percent}%`}
          </p>
        </div>
        {job.progress_notes && (
          <div className="flex items-center gap-2 text-muted-foreground max-w-xs text-right">
            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="font-body text-xs italic leading-relaxed">{job.progress_notes}</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted mb-8 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="grid grid-cols-5 gap-2">
        {STAGES.map((stage) => {
          const reached = percent >= stage.minPercent;
          const Icon = reached ? CheckCircle2 : Circle;
          return (
            <div key={stage.key} className="text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${reached ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`font-display text-[10px] tracking-wider uppercase ${reached ? 'text-foreground' : 'text-muted-foreground'}`}>
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
