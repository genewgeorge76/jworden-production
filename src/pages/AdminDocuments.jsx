import React, { useEffect, useState } from 'react';
import { Activity, Archive, CheckCircle2, Copy, Download, Loader2, RefreshCw, ShieldOff, Sparkles, TriangleAlert } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import JobPicker from '../components/admin/JobPicker';
import DocumentUploader from '../components/admin/DocumentUploader';
import JobProgressEditor from '../components/admin/JobProgressEditor';
import ExistingDocuments from '../components/admin/ExistingDocuments';

function AdminOpsPanel({ isAdmin, selectedJob, documents, onSeeded, onChanged }) {
  const [seeding, setSeeding] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [seedResult, setSeedResult] = useState(null);
  const [seedError, setSeedError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const { data: monitoringStatus } = useQuery({
    queryKey: ['admin-monitoring-status'],
    queryFn: () => api.getMonitoringStatus(),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const monitoring = monitoringStatus?.monitoring || null;
  const slackReady = Boolean(monitoring?.slack_enabled);
  const datadogReady = Boolean(monitoring?.datadog_enabled);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedError('');
    setActionMessage('');
    setSeedResult(null);
    try {
      const result = await api.seedDemoWorkspace(true);
      setSeedResult(result);
      onSeeded?.(result);
    } catch (error) {
      setSeedError(error?.message || 'Could not seed demo workspace.');
    } finally {
      setSeeding(false);
    }
  };

  const updateSelectedJob = async (action, payload, message) => {
    if (!selectedJob?.id) return;
    setActionBusy(action);
    setSeedError('');
    setActionMessage('');
    try {
      await api.entities.Job.update(selectedJob.id, payload);
      setActionMessage(message);
      onChanged?.();
    } catch (error) {
      setSeedError(error?.message || 'Could not update job.');
    } finally {
      setActionBusy('');
    }
  };

  const copyEtaLink = async () => {
    if (!selectedJob?.id) return;
    const link = `${window.location.origin}/crew-eta?jobId=${selectedJob.id}`;
    await navigator.clipboard?.writeText(link);
    setActionMessage('ETA link copied.');
  };

  const exportProjectPacket = async () => {
    if (!selectedJob?.id) return;
    setActionBusy('export');
    setActionMessage('');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('J. Worden & Sons Paving LLC', 18, 22);
      doc.setFontSize(14);
      doc.text(selectedJob.title || selectedJob.name || `Job ${selectedJob.id}`, 18, 34);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const rows = [
        `Customer: ${selectedJob.client_name || 'Customer'}`,
        `Email: ${selectedJob.client_email || 'Not set'}`,
        `Address: ${selectedJob.address || selectedJob.site_address || 'Not set'}`,
        `Status: ${selectedJob.status || 'scheduled'}`,
        `Progress: ${selectedJob.progress_percent || 0}%`,
        `ETA: ${window.location.origin}/crew-eta?jobId=${selectedJob.id}`,
      ];
      rows.forEach((line, index) => doc.text(line, 18, 50 + index * 8));
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Documents', 18, 106);
      doc.setFont('helvetica', 'normal');
      (documents || []).slice(0, 18).forEach((item, index) => {
        doc.text(`${index + 1}. ${item.title || item.filename} (${item.document_type || 'document'})`, 18, 120 + index * 7);
      });
      doc.save(`jworden-project-${selectedJob.id}-packet.pdf`);
      setActionMessage('Project packet exported.');
    } catch (error) {
      setSeedError(error?.message || 'Could not export packet.');
    } finally {
      setActionBusy('');
    }
  };

  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
      <div className="border border-primary/30 bg-primary/5 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-2">
              // Maintenance
            </p>
            <h2 className="font-display font-black text-foreground text-2xl uppercase tracking-tight">
              Production Demo Workspace
            </h2>
            <p className="font-body text-muted-foreground text-sm mt-2 max-w-2xl">
              Seeds one polished commercial resurfacing job with portal documents, progress, work order, audit evidence, and ETA data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={seeding}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-xs tracking-wider uppercase px-5 py-3 hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {seeding ? 'Seeding' : 'Seed Demo'}
          </button>
        </div>

        {seedResult ? (
          <div className="mt-4 border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-foreground">
            <p className="font-display font-bold uppercase tracking-wide text-emerald-300">Demo ready</p>
            <p className="mt-1 text-muted-foreground">
              {seedResult.job?.title} · Job #{seedResult.job?.id} · {seedResult.documents?.length || 0} client document(s)
            </p>
          </div>
        ) : null}
        {selectedJob ? (
          <div className="mt-5 border-t border-primary/20 pt-4">
            <p className="font-display text-muted-foreground text-xs tracking-[0.25em] uppercase mb-3">
              Selected Job Actions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
              <button type="button" onClick={() => updateSelectedJob('complete', { status: 'completed', progress_percent: 100, progress_notes: 'Project complete. Final walkthrough and closeout packet are ready.' }, 'Job marked complete.')} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-xs font-display font-bold uppercase tracking-wider hover:border-primary disabled:opacity-60">
                <CheckCircle2 className="w-4 h-4" /> Complete
              </button>
              <button type="button" onClick={() => updateSelectedJob('reset', { status: 'in_progress', progress_percent: 62, progress_notes: 'Milling and base repairs are complete. Surface lift is scheduled for the morning weather window, then striping follows after cure time.' }, 'Demo progress reset.')} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-xs font-display font-bold uppercase tracking-wider hover:border-primary disabled:opacity-60">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
              <button type="button" onClick={() => updateSelectedJob('archive', { status: 'cancelled', progress_notes: 'Demo job archived from Admin Documents maintenance controls.' }, 'Demo job archived.')} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-xs font-display font-bold uppercase tracking-wider hover:border-primary disabled:opacity-60">
                <Archive className="w-4 h-4" /> Archive
              </button>
              <button type="button" onClick={copyEtaLink} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-xs font-display font-bold uppercase tracking-wider hover:border-primary disabled:opacity-60">
                <Copy className="w-4 h-4" /> ETA Link
              </button>
              <button type="button" onClick={exportProjectPacket} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-xs font-display font-bold uppercase tracking-wider hover:border-primary disabled:opacity-60">
                <Download className="w-4 h-4" /> Packet
              </button>
            </div>
          </div>
        ) : null}
        {actionMessage ? (
          <div className="mt-4 border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-foreground">
            {actionMessage}
          </div>
        ) : null}
        {seedError ? (
          <div className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {seedError}
          </div>
        ) : null}
      </div>

      <div className="border border-border bg-card p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="font-display font-black text-foreground text-lg uppercase tracking-tight">
            Monitoring Alerts
          </h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Slack alert channel', ready: slackReady },
            { label: 'Datadog metrics/events', ready: datadogReady },
            { label: 'Health endpoint', ready: true },
            { label: '5xx error alerts', ready: slackReady || datadogReady },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 border border-border bg-background/40 px-3 py-2">
              <span className="font-body text-sm text-foreground">{item.label}</span>
              <span className={`inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-wider ${item.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                {item.ready ? <CheckCircle2 className="w-3.5 h-3.5" /> : <TriangleAlert className="w-3.5 h-3.5" />}
                {item.ready ? 'Ready' : 'Needs Env'}
              </span>
            </div>
          ))}
        </div>
        <p className="font-body text-muted-foreground text-xs mt-4">
          Service: {monitoring?.dd_service || 'jworden-api'} · Env: {monitoring?.dd_env || 'production'}
        </p>
      </div>
    </div>
  );
}

export default function AdminDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [selectedJobId, setSelectedJobId] = useState(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => api.entities.Job.list('-scheduled_date', 500),
    enabled: isAdmin,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['admin-job-docs', selectedJobId],
    queryFn: () => api.entities.ProjectDocument.filter({ job_id: selectedJobId }),
    enabled: isAdmin && !!selectedJobId,
  });

  // Auto-select first job when loaded
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-job-docs', selectedJobId] });
  };

  const handleSeeded = (result) => {
    queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-monitoring-status'] });
    if (result?.job?.id) {
      setSelectedJobId(result.job.id);
      queryClient.invalidateQueries({ queryKey: ['admin-job-docs', result.job.id] });
    }
  };

  // Admin gate
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="pt-32 pb-20 max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/40 flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight mb-3">
            Admin Access Required
          </h1>
          <p className="font-body text-muted-foreground text-base">
            This page is restricted to administrators only.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Admin · Customer Documents | J. Worden & Sons"
        description="Internal tool for uploading customer-facing documents and progress updates."
        canonicalPath="/admin/documents"
      />
      <Navbar />

      <section className="pt-32 pb-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            // Admin Tools
          </p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
            Customer Documents
          </h1>
          <p className="font-body text-muted-foreground text-base mt-3 max-w-2xl">
            Upload invoices, warranty docs, and progress photos. Update project status so customers see live updates in their portal at <code>/portal</code>.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AdminOpsPanel
            isAdmin={isAdmin}
            selectedJob={selectedJob}
            documents={documents}
            onSeeded={handleSeeded}
            onChanged={handleRefresh}
          />

          {jobsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center max-w-xl mx-auto">
              <p className="font-display font-bold text-foreground text-xl uppercase tracking-tight mb-2">
                No Jobs Yet
              </p>
              <p className="font-body text-muted-foreground text-sm">
                Create a job record before uploading customer documents.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
              <aside>
                <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase mb-4">
                  Select Job ({jobs.length})
                </p>
                <JobPicker
                  jobs={jobs}
                  selectedId={selectedJob?.id}
                  onSelect={(j) => setSelectedJobId(j.id)}
                />
              </aside>

              <main className="space-y-6">
                {selectedJob && (
                  <>
                    {/* Selected job summary */}
                    <div className="border border-border bg-card p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-2">
                            Editing
                          </p>
                          <p className="font-display font-black text-foreground text-2xl uppercase tracking-tight truncate">
                            {selectedJob.title}
                          </p>
                          <p className="font-body text-muted-foreground text-sm mt-1">
                            {selectedJob.client_name || '—'}
                            {selectedJob.client_email && (
                              <span className="ml-2">· {selectedJob.client_email}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <JobProgressEditor job={selectedJob} onSaved={handleRefresh} />
                      <DocumentUploader job={selectedJob} onUploaded={handleRefresh} />
                    </div>

                    <ExistingDocuments documents={documents} onChange={handleRefresh} />
                  </>
                )}
              </main>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
