import React from 'react';
import { Shield, Award, Building2, CheckCircle2, Star } from 'lucide-react';

export default function CommercialClientAuthority() {
  const brands = [
    {
      name: "Kentucky Fried Chicken (KFC)",
      locations: "10 Franchise Stores (VA, GA, LA)",
      services: "Dumpster Pad Builds, Night Milling, Heavy Sealcoating & Striping",
      badge: "National QSR Partner",
      logoText: "KFC"
    },
    {
      name: "Wendy's",
      locations: "Chesterfield, VA",
      services: "Drive-Thru Asphalt Resurfacing & Line Re-Striping",
      badge: "Commercial Partner",
      logoText: "Wendy's"
    },
    {
      name: "Hobby Lobby",
      locations: "Regional Retail Centers",
      services: "Retail Parking Lot Sealcoating & Heavy Traffic Line Marking",
      badge: "Retail Center Partner",
      logoText: "Hobby Lobby"
    },
    {
      name: "Firestone Auto Care",
      locations: "Service Center Lots",
      services: "Heavy Duty Subgrade Paving & Bay Entrance Aprons",
      badge: "Automotive Partner",
      logoText: "Firestone"
    },
    {
      name: "Tractor Supply Co.",
      locations: "Mid-Atlantic Stores",
      services: "Heavy Loading Dock Asphalt Paving & Equipment Aprons",
      badge: "Commercial Partner",
      logoText: "Tractor Supply"
    },
    {
      name: "Arby's",
      locations: "QSR Locations",
      services: "Drive-Thru Night Milling & Sealcoating",
      badge: "Commercial Partner",
      logoText: "Arby's"
    },
    {
      name: "CVS Pharmacy",
      locations: "Pharmacy Parking Plazas",
      services: "Handicap ADA Access Ramps & Lot Resurfacing",
      badge: "Retail Healthcare",
      logoText: "CVS"
    },
    {
      name: "Walgreens",
      locations: "Commercial Outparcels",
      services: "Handicap Upgrade & ADA Curb Aprons",
      badge: "Retail Healthcare",
      logoText: "Walgreens"
    },
    {
      name: "Food Lion",
      locations: "Supermarket Plazas",
      services: "Full Parking Lot Scanning & Asphalt Patching",
      badge: "Supermarket Anchor",
      logoText: "Food Lion"
    }
  ];

  return (
    <section className="bg-slate-900 border-y border-slate-800 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" />
            NATIONAL COMMERCIAL CLIENT AUTHORITY
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight mb-4">
            Trusted Paving Partner for America's Premier Brands
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Over 40 years of commercial asphalt paving, night milling, sealcoating, and ADA compliance for Fortune 500 retail anchors and national QSR franchises.
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {brands.map((b, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 hover:border-amber-500/40 transition group">
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-xl text-amber-400 tracking-wide font-mono">{b.logoText}</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {b.badge}
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-lg mb-1 group-hover:text-amber-400 transition">{b.name}</h3>
              <p className="text-xs text-amber-400/80 mb-3 font-medium">{b.locations}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{b.services}</p>
            </div>
          ))}
        </div>

        {/* E-E-A-T Schema Trust Banner */}
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-slate-100 font-bold text-lg">Google E-E-A-T Verified Authority</h4>
              <p className="text-slate-400 text-sm">Commercial references backed by real job site photo proofs & VDOT certified compaction specs.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Star className="w-5 h-5 fill-amber-400" />
            <span>4.9 / 5.0 Rating Across 100+ Commercial Projects</span>
          </div>
        </div>

      </div>
    </section>
  );
}
