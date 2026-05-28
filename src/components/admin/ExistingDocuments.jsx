import React from 'react';
import { FileText, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';

const TYPE_LABELS = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  warranty: 'Warranty',
  contract: 'Contract',
  progress_photo: 'Photo',
  other: 'Other',
};

export default function ExistingDocuments({ documents, onChange }) {
  const handleToggleVisible = async (doc) => {
    try {
      await api.entities.ProjectDocument.update(doc.id, {
        visible_to_client: !doc.visible_to_client,
      });
      toast.success(`Document ${!doc.visible_to_client ? 'shown' : 'hidden'} in portal.`);
      onChange?.();
    } catch (error) {
      toast.error('Failed to update.');
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await api.entities.ProjectDocument.delete(doc.id);
      toast.success('Document deleted.');
      onChange?.();
    } catch (error) {
      toast.error('Failed to delete.');
    }
  };

  return (
    <div className="border border-border bg-card p-6">
      <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-5">
        Shared Documents ({documents.length})
      </p>

      {documents.length === 0 ? (
        <p className="font-body text-muted-foreground text-sm italic py-4">
          No documents uploaded for this job yet.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 border border-border hover:border-primary/40 transition-colors"
            >
              <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground text-sm truncate">{doc.title}</p>
                <p className="font-body text-muted-foreground text-xs mt-0.5">
                  <span className="uppercase tracking-wider">{TYPE_LABELS[doc.document_type] || 'Document'}</span>
                  {!doc.visible_to_client && (
                    <span className="ml-2 text-yellow-400">· Hidden from portal</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  aria-label="Open document"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleToggleVisible(doc)}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  aria-label={doc.visible_to_client ? 'Hide from portal' : 'Show in portal'}
                >
                  {doc.visible_to_client ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  aria-label="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
