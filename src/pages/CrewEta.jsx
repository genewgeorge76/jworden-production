import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { MapPin, Truck, Users, Clock, Phone, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Public-facing crew ETA page. Customers receive a link on job day:
 * /crew-eta?jobId=xxx
 *
 * Shows: crew on the way, ETA estimate, job status, contact card.
 * No auth required — the job ID in the URL is the key (short, disposable).
 */
export default function CrewEta() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    if (!jobId) {
      setError('No job ID in link');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const j = await api.getPublicJob(jobId);
        setJob(j);
      } catch {
        setError('Could not load job details');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="font-display text-muted-foreground text-sm tracking-wider uppercase mb-3">
            Job not found
          </p>
          <p className="font-body text-muted-foreground text-sm">
            If this link came from us, please call (804) 446-1296 for the status of your project.
          </p>
        </div>
      </div>
    );
  }

  const firstName = (job.client_name || 'there').split(' ')[0];
  const statusConfig = {
    scheduled: { label: 'Crew Dispatched', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/40' },
    in_progress: { label: 'Work in Progress', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/40' },
    completed: { label: 'Completed', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/40' },
  }[job.status] || { label: job.status, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-obsidian py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-2">
            J. Worden & Sons · Live Crew Tracker
          </p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95]">
            Good morning, {firstName}.
          </h1>
          <p className="font-body text-muted-foreground text-base md:text-lg mt-4 max-w-xl">
            Here's the latest on your project. This page refreshes automatically.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Status card */}
        <div className={`border-2 ${statusConfig.border} ${statusConfig.bg} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Current Status
            </p>
            {job.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
          </div>
          <p className={`font-display font-black text-4xl uppercase tracking-tight ${statusConfig.color}`}>
            {statusConfig.label}
          </p>
          {job.progress_percent > 0 && job.status === 'in_progress' && (
            <div className="mt-5">
              <div className="flex justify-between mb-2">
                <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase">Progress</p>
                <p className="font-display font-black text-foreground text-sm">{job.progress_percent}%</p>
              </div>
              <div className="h-2 bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${job.progress_percent}%` }}
                />
              </div>
            </div>
          )}
          {job.progress_notes && (
            <p className="font-body text-foreground text-sm mt-4 pt-4 border-t border-border italic">
              "{job.progress_notes}"
            </p>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard icon={Clock} label="Scheduled" value={
            job.scheduled_date
              ? new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : '—'
          } sub={job.start_time} />
          <InfoCard icon={MapPin} label="Job Site" value={job.address || '—'} />
          <InfoCard icon={Users} label="Crew Lead" value={job.crew || 'Worden crew'} />
          <InfoCard icon={Truck} label="Surface Type" value={job.surface_type ? job.surface_type.replace(/_/g, ' ') : '—'} />
        </div>

        {/* Contact card */}
        <div className="border border-border bg-card p-6">
          <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-3">
            Questions? Concerns?
          </p>
          <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight mb-4">
            We're a phone call away.
          </h3>
          <a
            href="tel:+18044461296"
            className="flex items-center justify-center gap-3 bg-primary text-primary-foreground font-display font-bold text-base tracking-wider uppercase py-4 hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call (804) 446-1296
          </a>
        </div>

        <p className="font-body text-muted-foreground text-xs text-center pt-4">
          J. Worden & Sons Paving LLC · 40+ years in Central Virginia · Licensed · Bonded · Insured
        </p>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <p className="font-display text-muted-foreground text-[10px] tracking-[0.25em] uppercase">{label}</p>
      </div>
      <p className="font-display font-black text-foreground text-lg uppercase tracking-tight leading-tight">
        {value}
      </p>
      {sub && <p className="font-body text-muted-foreground text-sm mt-1">{sub}</p>}
    </div>
  );
}
