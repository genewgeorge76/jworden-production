import React from 'react';
import { FileText, Shield, Image as ImageIcon, FileSignature, Receipt, File, Download } from 'lucide-react';

const TYPE_CONFIG = {
  invoice: { icon: Receipt, label: 'Invoice', color: 'text-primary' },
  warranty: { icon: Shield, label: 'Warranty', color: 'text-green-400' },
  contract: { icon: FileSignature, label: 'Contract', color: 'text-blue-400' },
  receipt: { icon: FileText, label: 'Receipt', color: 'text-primary' },
  progress_photo: { icon: ImageIcon, label: 'Photo', color: 'text-yellow-400' },
  other: { icon: File, label: 'Document', color: 'text-muted-foreground' },
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentList({ title, documents, emptyMessage }) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-5">{title}</p>

      {documents.length === 0 ? (
        <p className="font-body text-muted-foreground text-sm italic py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const config = TYPE_CONFIG[doc.document_type] || TYPE_CONFIG.other;
            const Icon = config.icon;
            return (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-4 p-3 border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
              >
                <div className="w-10 h-10 bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-sm truncate">{doc.title}</p>
                  <p className="font-body text-muted-foreground text-xs mt-0.5 flex items-center gap-2">
                    <span className="uppercase tracking-wider">{config.label}</span>
                    {doc.file_size_bytes && (
                      <>
                        <span>·</span>
                        <span>{formatBytes(doc.file_size_bytes)}</span>
                      </>
                    )}
                  </p>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
