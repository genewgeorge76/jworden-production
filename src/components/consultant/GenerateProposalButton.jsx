import React, { useState } from 'react';
import { api } from '@/api/client';
import { FileText, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/**
 * One-click proposal PDF generator for the selected lead.
 * Builds a branded PDF, emails it to the lead, and marks the lead as "quoted".
 */
export default function GenerateProposalButton({ lead, onGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!lead?.id) return;
    setGenerating(true);
    setResult(null);
    try {
      const response = await api.functions.invoke('generateProposalPDF', {
        lead_id: lead.id,
      });
      const data = response?.data || response;
      if (data?.success) {
        setResult(data);
        toast.success(
          data.emailed
            ? `Proposal emailed to ${lead.email}`
            : 'Proposal generated (no email on file — owner copy sent)'
        );
        onGenerated?.(data);
      } else {
        toast.error(data?.error || 'Failed to generate proposal');
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to generate proposal');
    } finally {
      setGenerating(false);
    }
  };

  if (result?.file_url) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-2 border border-primary/40 bg-primary/5 text-primary font-display font-bold text-xs tracking-wider uppercase">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Proposal Sent · ${result.estimate_low?.toLocaleString()}–${result.estimate_high?.toLocaleString()}
        </span>
        <a
          href={result.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-foreground font-display font-bold text-xs tracking-wider uppercase hover:border-primary hover:text-primary"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View PDF
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={run}
      disabled={generating || !lead?.id}
      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-display font-bold text-xs tracking-wider uppercase hover:bg-primary/90 disabled:opacity-60"
      title={lead?.email ? `Email PDF proposal to ${lead.email}` : 'Generate & email PDF proposal'}
    >
      {generating ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="w-3.5 h-3.5" />
          Generate Proposal
        </>
      )}
    </button>
  );
}
