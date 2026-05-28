import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';

const DOC_TYPES = [
  { id: 'invoice', label: 'Invoice' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'contract', label: 'Contract' },
  { id: 'progress_photo', label: 'Progress Photo' },
  { id: 'other', label: 'Other' },
];

export default function DocumentUploader({ job, onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('invoice');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibleToClient, setVisibleToClient] = useState(true);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setDocType('invoice');
    setVisibleToClient(true);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error('Please select a file and give it a title.');
      return;
    }
    if (!job.client_email) {
      toast.error('This job has no client_email set. Add it before uploading.');
      return;
    }

    setUploading(true);
    try {
      await api.uploadProjectDocument(file, {
        job_id: job.id,
        client_email: job.client_email,
        document_type: docType,
        title: title.trim(),
        description: description.trim() || undefined,
        visible_to_client: visibleToClient,
      });
      toast.success('Document uploaded and shared with the customer.');
      reset();
      onUploaded?.();
    } catch (error) {
      toast.error(error.message || 'Upload failed — please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-border bg-card p-6">
      <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-5">Upload Document</p>

      {!job.client_email && (
        <div className="border border-destructive/40 bg-destructive/10 text-destructive font-body text-sm p-3 mb-4">
          ⚠️ This job has no <code>client_email</code> set. Edit the job and add the customer's email before uploading.
        </div>
      )}

      {/* File picker */}
      <label
        htmlFor="doc-file"
        className={`block cursor-pointer border-2 border-dashed p-6 mb-4 transition-colors ${
          file ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40'
        }`}
      >
        <input ref={inputRef} id="doc-file" type="file" onChange={handleFile} className="hidden" />
        {file ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-sm truncate">{file.name}</p>
              <p className="font-body text-muted-foreground text-xs">
                {(file.size / 1024).toFixed(0)} KB · Click to change
              </p>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); reset(); }}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="font-display text-foreground text-sm tracking-wider uppercase">Choose file</p>
            <p className="font-body text-muted-foreground text-xs">PDF, PNG, JPG, DOCX, etc.</p>
          </div>
        )}
      </label>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
            Document Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DOC_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setDocType(t.id)}
                className={`py-2.5 px-3 border font-display text-xs tracking-wider uppercase transition-colors ${
                  docType === t.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Final Invoice · April 2026"
            className="w-full h-11 bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 px-3 font-body focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short caption shown to the customer"
            className="w-full h-11 bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 px-3 font-body focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={visibleToClient}
            onChange={(e) => setVisibleToClient(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="font-body text-foreground text-sm">Visible to client in portal</span>
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || !title.trim() || uploading || !job.client_email}
          className={`w-full flex items-center justify-center gap-2 font-display font-bold text-sm tracking-wider uppercase min-h-[48px] py-3 transition-colors ${
            file && title.trim() && !uploading && job.client_email
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Upload & Share
            </>
          )}
        </button>
      </div>
    </div>
  );
}
