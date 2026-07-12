/**
 * ClientHandoverTab — Digital Twin Client Handover
 *
 * Generates a professional "Project Digital Twin" report card for commercial clients.
 * Covers: as-built specs, quality certification, maintenance roadmap, and Worden heritage.
 *
 * Standards: VDOT Section 315 · ASTM D2939 · AASHTO T245 · ADA 2010
 */
import { useState, useRef } from 'react';
import {
  Award,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Copy,
  Download,
  HardHat,
  Layers,
  MapPin,
  Phone,
  Printer,
  Share2,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import {
  DEMO_JOBS,
  MAINTENANCE_SCHEDULE,
  type CompletedJob,
  type MaintenanceWindow,
} from '@/lib/industrialDigitalTwin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtYear(iso: string, offset: number): string {
  return addYears(new Date(iso), offset).getFullYear().toString();
}

function serviceLabel(s: CompletedJob['serviceType']): string {
  const map: Record<CompletedJob['serviceType'], string> = {
    'asphalt-new': 'Full-Depth Asphalt Paving (New)',
    'asphalt-overlay': 'Asphalt Mill & Overlay',
    sealcoat: 'Pavement Sealcoating',
    concrete: 'Concrete Paving / Flatwork',
    masonry: 'Masonry / Hardscape',
    roofing: 'Commercial Roofing',
    'gc-commercial': 'General Contracting (Commercial)',
  };
  return map[s] ?? s;
}

const WINDOW_DEFS: Array<{ key: MaintenanceWindow; yearOffset: number; color: string; bg: string; border: string }> = [
  { key: 'year1',  yearOffset: 1,  color: 'text-blue-400',   bg: 'bg-blue-950/20',   border: 'border-blue-700' },
  { key: 'year3',  yearOffset: 3,  color: 'text-[#ffcc00]',  bg: 'bg-yellow-950/10', border: 'border-yellow-700' },
  { key: 'year5',  yearOffset: 5,  color: 'text-orange-400', bg: 'bg-orange-950/20', border: 'border-orange-700' },
  { key: 'year12', yearOffset: 12, color: 'text-red-400',    bg: 'bg-red-950/20',    border: 'border-red-700' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Spec({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{label}</span>
      <span className={`text-sm font-bold text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function QualityBadge({ pass, value, label }: { pass: boolean; value: string; label: string }) {
  return (
    <div className={`flex flex-col items-center justify-center border p-4 text-center ${pass ? 'border-green-700 bg-green-950/20' : 'border-red-700 bg-red-950/20'}`}>
      {pass
        ? <CheckCircle size={22} className="text-green-400 mb-1" />
        : <ShieldCheck size={22} className="text-red-400 mb-1" />}
      <div className={`text-2xl font-black ${pass ? 'text-green-400' : 'text-red-400'}`}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-200 mt-0.5">{label}</div>
      <div className={`text-[10px] font-black mt-1 ${pass ? 'text-green-500' : 'text-red-500'}`}>
        {pass ? '✅ CERTIFIED' : '⚠️ REVIEW'}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ClientHandoverTab() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_JOBS[0].id);
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const job = DEMO_JOBS.find((j) => j.id === selectedId) ?? DEMO_JOBS[0];

  function handleCopyLink() {
    const url = `https://www.jwordenasphaltpaving.com/project-twin/${job.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-8">
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
            <Share2 size={20} className="text-[#ffcc00]" />
            Digital Twin — Client Handover Report
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Generate a professional as-built record for your commercial client. This document locks in your
            standards, certifies compaction, and schedules future maintenance — making it impossible for them
            to use another contractor.
          </p>
        </div>

        {/* Job selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Select Completed Job</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-[#111] border border-gray-700 text-white text-sm font-bold px-3 py-2 focus:border-[#ffcc00] outline-none min-w-[260px]"
          >
            {DEMO_JOBS.map((j) => (
              <option key={j.id} value={j.id}>
                {j.id} — {j.clientName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Action Bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#ffcc00] text-black font-black uppercase tracking-wider px-5 py-3 text-sm hover:bg-white transition-all"
        >
          <Printer size={16} />
          Print / Save PDF
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-transparent border-2 border-[#ffcc00] text-[#ffcc00] font-black uppercase tracking-wider px-5 py-3 text-sm hover:bg-[#ffcc00] hover:text-black transition-all"
        >
          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Shareable Link'}
        </button>
        <button
          className="flex items-center gap-2 bg-transparent border border-gray-700 text-gray-200 font-black uppercase tracking-wider px-5 py-3 text-sm hover:border-gray-500 hover:text-white transition-all"
          title="Send via email (coming soon)"
        >
          <Download size={16} />
          Email to Client
        </button>
      </div>

      {/* ── THE REPORT ──────────────────────────────────────────────────── */}
      <div ref={reportRef} className="border border-gray-700 bg-[#0d0d0d] space-y-0 print:bg-white print:text-black">

        {/* Report Header */}
        <div className="bg-[#ffcc00] px-8 py-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-black text-[10px] font-black uppercase tracking-[0.4em] mb-1">Project Digital Twin</div>
            <h1 className="text-black text-3xl font-black uppercase leading-tight tracking-tighter">
              J. Worden &amp; Sons<br />
              <span className="text-2xl">As-Built Record</span>
            </h1>
            <p className="text-black/70 text-xs font-bold mt-1">
              4th Generation · Since 1984 · Virginia Class A Licensed
            </p>
          </div>
          <div className="text-right">
            <div className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-1">Job Number</div>
            <div className="text-black text-2xl font-black font-mono">{job.id}</div>
            <div className="text-black/70 text-xs font-bold mt-1">Completion: {fmtDate(job.completionDate)}</div>
          </div>
        </div>

        {/* Client + Site */}
        <div className="border-b border-gray-800 px-8 py-6 grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 text-[#ffcc00] mb-4">
              <Building2 size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Client</span>
            </div>
            <div className="space-y-2">
              <Spec label="Client / Organization" value={job.clientName} />
              <Spec label="Contact Email" value={job.clientEmail} />
              <Spec label="Phone" value={job.clientPhone} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[#ffcc00] mb-4">
              <MapPin size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Property</span>
            </div>
            <div className="space-y-2">
              <Spec label="Site Address" value={job.propertyAddress} />
              <Spec label="City / State" value={`${job.city}, ${job.stateCode}`} />
              <Spec label="Service Type" value={serviceLabel(job.serviceType)} />
            </div>
          </div>
        </div>

        {/* As-Built Technical Record */}
        <div className="border-b border-gray-800 px-8 py-6">
          <div className="flex items-center gap-2 text-[#ffcc00] mb-5">
            <Layers size={16} />
            <span className="text-xs font-black uppercase tracking-widest">As-Built Technical Record</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
            <Spec label="Area (sq ft)" value={job.sqFt > 0 ? job.sqFt.toLocaleString() : 'N/A'} />
            <Spec label="Material Used" value={job.tonsUsed > 0 ? `${job.tonsUsed.toLocaleString()} tons` : 'N/A'} />
            <Spec label="Base Depth" value={job.baseDepthIn > 0 ? `${job.baseDepthIn}"` : 'N/A'} />
            <Spec label="Surface Depth" value={job.surfaceDepthIn > 0 ? `${job.surfaceDepthIn}"` : 'N/A'} />
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <Spec label="Asphalt Mix Specification" value={job.asphaltMixSpec} mono />
            <Spec label="Stone Base Specification" value={job.stoneBaseSpec} mono />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Spec label="Weather at Pour" value={job.weatherAtPour || 'N/A'} />
            <Spec label="Ambient Temp" value={job.ambientTempF > 0 ? `${job.ambientTempF}°F` : 'N/A'} />
            <Spec label="Ground Temp" value={job.groundTempF > 0 ? `${job.groundTempF}°F` : 'N/A'} />
            <Spec label="Sealer Brand" value={job.sealerBrand || 'N/A'} />
          </div>
        </div>

        {/* Crew & Foreman */}
        <div className="border-b border-gray-800 px-8 py-6 grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 text-[#ffcc00] mb-4">
              <HardHat size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Crew & Supervision</span>
            </div>
            <div className="space-y-2">
              <Spec label="Lead Crew" value={job.crew || 'N/A'} />
              <Spec label="Foreman" value={job.foreman || 'N/A'} />
            </div>
          </div>
          {job.notes && (
            <div>
              <div className="flex items-center gap-2 text-[#ffcc00] mb-4">
                <ClipboardCheck size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Field Notes</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Quality Certification */}
        <div className="border-b border-gray-800 px-8 py-6">
          <div className="flex items-center gap-2 text-[#ffcc00] mb-5">
            <Award size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Quality Certification</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <QualityBadge
              pass={job.compactionPct >= 96}
              value={job.compactionPct > 0 ? `${job.compactionPct}%` : 'N/A'}
              label="Marshall Unit Weight"
            />
            <QualityBadge
              pass={job.baseDepthIn >= 6 || job.serviceType === 'sealcoat'}
              value={job.baseDepthIn > 0 ? `${job.baseDepthIn}"` : 'N/A'}
              label="VDOT Stone Base Depth"
            />
            <QualityBadge
              pass={job.ambientTempF >= 50}
              value={job.ambientTempF > 0 ? `${job.ambientTempF}°F` : 'N/A'}
              label="Pour Temp ≥50°F"
            />
            <QualityBadge
              pass={true}
              value="✓"
              label="VA Class A Licensed"
            />
          </div>
          <div className="bg-[#ffcc00]/10 border border-[#ffcc00]/30 px-5 py-3 text-xs text-[#ffcc00] font-black">
            ⚙️ Standards: 96% Marshall Unit Weight (AASHTO T245) · VDOT Section 315 Aggregate Base ·
            ASTM D2939 Sealcoat · 4th Generation Quality — Non-Negotiable Floor Since 1984
          </div>
        </div>

        {/* Maintenance Roadmap */}
        <div className="border-b border-gray-800 px-8 py-6">
          <div className="flex items-center gap-2 text-[#ffcc00] mb-5">
            <Calendar size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Maintenance Roadmap — Protecting Your Investment</span>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {WINDOW_DEFS.map(({ key, yearOffset, color, bg, border }) => {
              const sched = MAINTENANCE_SCHEDULE[key];
              const targetYear = fmtYear(job.completionDate, yearOffset);
              return (
                <div key={key} className={`border p-5 ${bg} ${border} flex flex-col gap-2`}>
                  <div className={`text-xs font-black uppercase tracking-widest ${color}`}>{sched.label}</div>
                  <div className={`text-2xl font-black ${color}`}>{targetYear}</div>
                  <p className="text-xs text-gray-200 leading-relaxed flex-1">{sched.action}</p>
                  <div className="text-[10px] font-black uppercase text-gray-200 border-t border-gray-800 pt-2">
                    Year +{yearOffset} · Contact Worden
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warranty & Heritage Statement */}
        <div className="border-b border-gray-800 px-8 py-6">
          <div className="flex items-center gap-2 text-[#ffcc00] mb-5">
            <ShieldCheck size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Warranty &amp; Worden Heritage Statement</span>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                J. Worden &amp; Sons guarantees all asphalt and paving work is installed per the specifications
                recorded in this Digital Twin document. Every job is backed by the Worden Standard: a
                minimum <strong className="text-white">96% Marshall Unit Weight compaction</strong>, a
                minimum <strong className="text-white">6" VDOT-grade structural stone base</strong>, and
                materials sourced exclusively to VDOT Section 315 specifications.
              </p>
              <p>
                This as-built record is your proof of quality. Share it with property managers,
                insurers, and future buyers. No other contractor in Virginia delivers this level of
                documented quality assurance on every project.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUp size={16} className="text-[#ffcc00] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-black uppercase text-[#ffcc00] mb-0.5">4th Generation Since 1984</div>
                  <div className="text-xs text-gray-200">40+ years of paving excellence in the Commonwealth of Virginia.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench size={16} className="text-[#ffcc00] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-black uppercase text-[#ffcc00] mb-0.5">Virginia Class A Licensed</div>
                  <div className="text-xs text-gray-200">Full GC capability: Div 01–33 CSI MasterFormat. Bonded & insured.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-[#ffcc00] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-black uppercase text-[#ffcc00] mb-0.5">Lifetime Maintenance Partnership</div>
                  <div className="text-xs text-gray-200">
                    Call <span className="text-white font-bold">804-446-1296</span> or visit{' '}
                    <span className="text-[#ffcc00]">jwordenasphaltpaving.com</span> to schedule your next maintenance window.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div className="px-8 py-5 flex items-center justify-between gap-4 text-xs text-gray-200 font-bold uppercase tracking-widest flex-wrap">
          <span>J. Worden &amp; Sons · 7011 Wood Rd, Richmond, VA · 804-446-1296</span>
          <span className="font-mono text-gray-700">Twin ID: {job.id} · Generated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
