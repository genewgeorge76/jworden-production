import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import { ArrowLeft, Mail, Loader2, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JobDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('id');

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState(null);

  useEffect(() => {
    if (!jobId) {
      navigate('/dashboard');
      return;
    }

    const fetchJob = async () => {
      const data = await api.entities.Job.get(jobId);
      setJob(data);
      setLoading(false);
    };

    fetchJob();
  }, [jobId, navigate]);

  const handleSendInvoice = async () => {
    setSendingInvoice(true);
    setInvoiceStatus(null);

    try {
      const response = await api.functions.invoke('generateAndEmailInvoice', { jobId });
      setInvoiceStatus({ type: 'success', message: 'Invoice sent successfully!' });
      setTimeout(() => setInvoiceStatus(null), 3000);
    } catch (error) {
      setInvoiceStatus({ type: 'error', message: error.message });
    } finally {
      setSendingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display font-bold text-foreground text-xl">Job not found</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-muted rounded transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">
              {job.title}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {job.address}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and dates */}
            <div className="border border-border bg-card p-6 rounded-lg">
              <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide mb-4">
                Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wider uppercase">Status</p>
                  <p className={`font-display font-bold text-lg mt-1 ${
                    job.status === 'completed' ? 'text-primary' : job.status === 'in_progress' ? 'text-blue-400' : 'text-secondary-foreground'
                  }`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wider uppercase">Scheduled Date</p>
                  <p className="font-display font-bold text-foreground text-lg mt-1">
                    {job.scheduled_date || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wider uppercase">Start Time</p>
                  <p className="font-display font-bold text-foreground mt-1">
                    {job.start_time || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wider uppercase">Surface Type</p>
                  <p className="font-display font-bold text-foreground mt-1">
                    {job.surface_type ? job.surface_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Job details */}
            <div className="border border-border bg-card p-6 rounded-lg">
              <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide mb-4">
                Project Details
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Square Footage', value: job.sqft ? Math.round(job.sqft).toLocaleString() + ' sq ft' : '—' },
                  { label: 'Crew', value: job.crew || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="font-display font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Client info */}
            <div className="border border-border bg-card p-6 rounded-lg">
              <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide mb-4">
                Client Information
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Name', value: job.client_name || '—' },
                  { label: 'Phone', value: job.client_phone || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="font-display font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {job.notes && (
              <div className="border border-border bg-card p-6 rounded-lg">
                <h2 className="font-display font-bold text-foreground text-lg uppercase tracking-wide mb-4">
                  Notes
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{job.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-4">
            {/* Invoice section */}
            <div className="border border-border bg-card p-6 rounded-lg">
              <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-4">
                Invoice
              </h3>
              <button
                onClick={handleSendInvoice}
                disabled={sendingInvoice || job.status !== 'completed'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-display font-bold text-sm tracking-wider uppercase rounded transition-colors ${
                  job.status === 'completed'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {sendingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Email Invoice
                  </>
                )}
              </button>

              {job.status !== 'completed' && (
                <p className="text-muted-foreground text-xs mt-3 text-center">
                  Available only for completed jobs
                </p>
              )}

              {invoiceStatus && (
                <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
                  invoiceStatus.type === 'success'
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-destructive/10 border border-destructive/30'
                }`}>
                  {invoiceStatus.type === 'success' ? (
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-xs ${
                    invoiceStatus.type === 'success' ? 'text-primary' : 'text-destructive'
                  }`}>
                    {invoiceStatus.message}
                  </p>
                </div>
              )}
            </div>

            {/* Job info card */}
            <div className="border border-border bg-muted/50 p-4 rounded-lg text-sm space-y-2">
              <div>
                <p className="text-muted-foreground text-xs tracking-wider uppercase">Job ID</p>
                <p className="font-mono text-xs text-foreground mt-1">{jobId}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">Created</p>
                <p className="text-xs text-foreground mt-1">
                  {new Date(job.created_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
