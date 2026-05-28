import React, { useEffect, useState } from 'react';
import { Loader2, LogOut, Phone, Mail, FolderOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ProjectCard from '../components/portal/ProjectCard';
import ProgressTracker from '../components/portal/ProgressTracker';
import DocumentList from '../components/portal/DocumentList';
import PhotoGallery from '../components/portal/PhotoGallery';
import ReferralCard from '../components/portal/ReferralCard';

export default function CustomerPortal() {
  const { user, logout } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState(null);
  const isAdminPreview = user?.role === 'admin';

  // Customer sessions are email-filtered; admin sessions can preview all projects.
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['portal-jobs', user?.email, isAdminPreview],
    queryFn: () => isAdminPreview ? api.entities.Job.list() : api.entities.Job.filter({ client_email: user.email }),
    enabled: isAdminPreview || !!user?.email,
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['portal-docs', user?.email, isAdminPreview],
    queryFn: () =>
      isAdminPreview
        ? api.entities.ProjectDocument.list()
        : api.entities.ProjectDocument.filter({
            client_email: user.email,
            visible_to_client: true,
          }),
    enabled: isAdminPreview || !!user?.email,
  });

  const loading = jobsLoading || docsLoading;

  // Auto-select first job when jobs load
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  // Filter documents for the currently selected job
  const jobDocs = selectedJob ? documents.filter((d) => d.job_id === selectedJob.id) : [];
  const invoices = jobDocs.filter((d) => ['invoice', 'receipt'].includes(d.document_type));
  const warranties = jobDocs.filter((d) => ['warranty', 'contract'].includes(d.document_type));
  const photos = jobDocs.filter((d) => d.document_type === 'progress_photo');
  const otherDocs = jobDocs.filter((d) => d.document_type === 'other');

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Customer Portal | J. Worden & Sons Paving LLC"
        description="Secure customer portal — view your project status, invoices, warranty documentation, and progress photos."
        canonicalPath="/portal"
      />
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
                // Customer Portal
              </p>
              <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
                Welcome, {user?.full_name?.split(' ')[0] || 'Client'}
              </h1>
              <p className="font-body text-muted-foreground text-base mt-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 font-display font-bold text-sm tracking-wider uppercase px-5 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display font-black text-foreground text-2xl uppercase tracking-tight mb-3">
                No Projects Yet
              </h2>
              <p className="font-body text-muted-foreground text-base leading-relaxed mb-6 max-w-md mx-auto">
                We don't have any projects linked to {isAdminPreview ? 'this admin preview' : `your email address (${user?.email})`} yet. If this seems wrong, please reach out to us.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="tel:+18044461296"
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase px-6 py-3 hover:bg-primary/90 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call (804) 446-1296
                </a>
                <a
                  href="mailto:j.wordenandsonspaving@gmail.com"
                  className="flex items-center justify-center gap-2 border border-border text-foreground font-display font-bold text-sm tracking-wider uppercase px-6 py-3 hover:border-foreground/40 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email Us
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
              {/* Sidebar — project list */}
              <aside>
                <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase mb-4">
                  Your Projects ({jobs.length})
                </p>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <ProjectCard
                      key={job.id}
                      job={job}
                      isActive={selectedJob?.id === job.id}
                      onSelect={(j) => setSelectedJobId(j.id)}
                    />
                  ))}
                </div>
              </aside>

              {/* Main — selected project detail */}
              <main className="space-y-6">
                {selectedJob && (
                  <>
                    {/* Project header */}
                    <div className="border border-border bg-card p-6 md:p-8">
                      <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
                        Project Details
                      </p>
                      <h2 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight mb-4">
                        {selectedJob.title}
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Address', value: selectedJob.address || '—' },
                          { label: 'Scheduled', value: selectedJob.scheduled_date ? new Date(selectedJob.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                          { label: 'Surface', value: selectedJob.surface_type ? selectedJob.surface_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—' },
                          { label: 'Area', value: selectedJob.sqft ? `${Math.round(selectedJob.sqft).toLocaleString()} sq ft` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-1">{label}</p>
                            <p className="font-display font-bold text-foreground text-sm">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress */}
                    <ProgressTracker job={selectedJob} />

                    {/* Documents — two columns on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DocumentList
                        title="Invoices & Receipts"
                        documents={invoices}
                        emptyMessage="No invoices posted yet."
                      />
                      <DocumentList
                        title="Warranty & Contracts"
                        documents={warranties}
                        emptyMessage="Warranty documentation will appear here once your project is completed."
                      />
                    </div>

                    {otherDocs.length > 0 && (
                      <DocumentList
                        title="Additional Documents"
                        documents={otherDocs}
                        emptyMessage=""
                      />
                    )}

                    {/* Photo gallery */}
                    <PhotoGallery photos={photos} />

                    {/* Referral program */}
                    <ReferralCard userEmail={user?.email} />

                    {/* Support card */}
                    <div className="border border-primary/30 bg-primary/5 p-6 md:p-8">
                      <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Need Help?</p>
                      <p className="font-body text-foreground text-base mb-5 leading-relaxed">
                        Questions about your project? Our team is a phone call away.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a
                          href="tel:+18044461296"
                          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase px-6 py-3 hover:bg-primary/90 transition-colors"
                        >
                          <Phone className="w-4 h-4" /> (804) 446-1296
                        </a>
                        <a
                          href="mailto:j.wordenandsonspaving@gmail.com"
                          className="flex items-center justify-center gap-2 border border-primary/40 text-foreground font-display font-bold text-sm tracking-wider uppercase px-6 py-3 hover:bg-primary/10 transition-colors"
                        >
                          <Mail className="w-4 h-4" /> Email Us
                        </a>
                      </div>
                    </div>
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
