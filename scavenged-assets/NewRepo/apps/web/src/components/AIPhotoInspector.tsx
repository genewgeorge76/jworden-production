import React, { useCallback, useRef, useState } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface Finding {
  type: string;
  coverage_pct: number;
  urgency: string;
}

interface InspectionResult {
  damage_detected: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  findings: Finding[];
  recommended_services: string[];
  estimated_lifespan_years: number;
  notes: string;
  engine: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  none: 'text-green-400 bg-green-400/10 border-green-400/20',
  minor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  moderate: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  severe: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const SERVICE_LABELS: Record<string, string> = {
  crack_filling: 'Crack Filling',
  sealcoating: 'Sealcoating',
  milling: 'Milling',
  resurfacing: 'Resurfacing',
  full_replacement: 'Full Replacement',
  patching: 'Patching',
  drainage: 'Drainage Correction',
};

export function AIPhotoInspector() {
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const inspect = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const form = new FormData();
    form.append('file', file);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/v1/ai/photo-inspect`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || `Server error ${res.status}`);
      }

      const data = await res.json() as InspectionResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inspection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) inspect(file);
  }, [inspect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) inspect(file);
  }, [inspect]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Zap size={11} /> GPT-4o Vision
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Asphalt Photo Inspector</h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          Upload a photo of your pavement and get an instant AI damage assessment — severity, findings, and recommended services.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-zinc-700 hover:border-yellow-500/50 rounded-2xl p-10 text-center cursor-pointer transition-colors mb-8 relative overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt="Uploaded pavement" className="max-h-72 mx-auto rounded-xl object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <Camera size={36} className="text-zinc-600" />
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1">Drop a photo here or click to upload</p>
              <p className="text-xs">JPEG, PNG, or WebP · Max 10 MB</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Upload size={11} /> or drag & drop
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 text-zinc-300 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-xl">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            Analyzing pavement condition…
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-4 text-sm mb-6">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Severity badge */}
          <div className={`flex items-center justify-between rounded-xl border px-5 py-4 ${SEVERITY_COLORS[result.severity] || SEVERITY_COLORS.moderate}`}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1">Damage Severity</div>
              <div className="text-2xl font-black capitalize">{result.severity}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-current/60 mb-1">Estimated Lifespan</div>
              <div className="text-xl font-bold">{result.estimated_lifespan_years} yr{result.estimated_lifespan_years !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Findings */}
          {result.findings.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Findings</h3>
              <div className="space-y-3">
                {result.findings.map((f, i) => (
                  <div key={i} className="flex items-start justify-between text-sm border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="text-zinc-200 font-medium capitalize">{f.type.replace(/_/g, ' ')}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{f.urgency}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{f.coverage_pct}%</div>
                      <div className="text-zinc-600 text-xs">affected</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended services */}
          {result.recommended_services.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Recommended Services</h3>
              <div className="flex flex-wrap gap-2">
                {result.recommended_services.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-lg">
                    <CheckCircle size={10} />
                    {SERVICE_LABELS[s] || s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {result.notes && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                <Clock size={11} /> Analyst Notes
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">{result.notes}</p>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-zinc-600 text-xs mb-4">
              This AI assessment is for informational purposes. Contact us for a free on-site professional inspection.
            </p>
            <a
              href="tel:+18044461296"
              className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Schedule Free Inspection — (804) 446-1296
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
