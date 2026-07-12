import { Link } from '@tanstack/react-router';
import { ArrowRight, Building2, FileCheck2, ShieldCheck } from 'lucide-react';

export default function PartnerPortal() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 md:p-12 shadow-2xl">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ffcc00]/30 bg-black/40 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#ffcc00]">
            <Building2 className="h-4 w-4" />
            Partner Access
          </span>
          <h3 className="mt-5 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
            GC Portal For Commercial Partners
          </h3>
          <p className="mt-4 max-w-2xl text-zinc-300">
            Access insurance documents, W-9 records, and priority dispatch intake in one secure workflow for general contractors and development teams.
          </p>
          <div className="mt-8 flex flex-col gap-4 text-sm font-bold text-zinc-300 md:flex-row md:items-center md:gap-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#ffcc00]" />
              Verified Compliance Docs
            </div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-[#ffcc00]" />
              One-Click Download Access
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-black/50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">Portal Access</p>
          <p className="mt-3 text-lg font-bold text-white">Open the contractor portal for project-ready documents and expedited scheduling.</p>
          <Link
            to="/portal"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#ffcc00] bg-[#ffcc00] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-white"
          >
            Open Partner Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
