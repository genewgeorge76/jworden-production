import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';

export default function JobProgressEditor({ job, onSaved }) {
  const [percent, setPercent] = useState(job.progress_percent || 0);
  const [notes, setNotes] = useState(job.progress_notes || '');
  const [status, setStatus] = useState(job.status || 'scheduled');
  const [saving, setSaving] = useState(false);

  // Reset local state when a different job is selected
  useEffect(() => {
    setPercent(job.progress_percent || 0);
    setNotes(job.progress_notes || '');
    setStatus(job.status || 'scheduled');
  }, [job.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.entities.Job.update(job.id, {
        progress_percent: Number(percent),
        progress_notes: notes,
        status,
      });
      toast.success('Project progress updated.');
      onSaved?.();
    } catch (error) {
      toast.error(error.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border bg-card p-6">
      <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-5">Update Project Progress</p>

      <div className="space-y-4">
        <div>
          <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
            Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['scheduled', 'in_progress', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`py-2.5 px-2 border font-display text-[10px] tracking-wider uppercase transition-colors ${
                  status === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-display text-muted-foreground text-xs tracking-wider uppercase">
              Completion %
            </label>
            <span className="font-display font-black text-primary text-lg">{percent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
            Latest Update Note (shown to customer)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Base course laid today. Surface lift scheduled for Thursday weather permitting."
            className="w-full bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 px-3 py-2 font-body text-sm focus:border-primary focus:outline-none transition-colors resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase min-h-[48px] py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Progress
            </>
          )}
        </button>
      </div>
    </div>
  );
}
