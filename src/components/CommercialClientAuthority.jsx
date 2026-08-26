import React from 'react';
import { Shield, Award, Building2, Star } from 'lucide-react';
import SmartImage from '@/components/SmartImage';

export default function CommercialClientAuthority() {
  const brands = [
    {
      name: "Kentucky Fried Chicken (KFC)",
      locations: "10 Franchise Stores (VA, GA, LA)",
      services: "Dumpster Pad Builds, Night Milling, Heavy Sealcoating & ADA Striping",
      badge: "National QSR Partner",
      logoText: "KFC",
      image: "/images/commercial_brands/kfc-real.png"
    },
    {
      name: "Wendy's Drive-Thru Paving",
      locations: "Chesterfield & Midlothian, VA",
      services: "Drive-Thru Lane Asphalt Resurfacing & High-Traffic Line Re-Striping",
      badge: "Commercial Partner",
      logoText: "Wendy's",
      image: "/images/commercial_brands/wendys-real.jpg"
    },
    {
      name: "Hobby Lobby Retail Plaza",
      locations: "Regional Retail Outlets in Central VA",
      services: "Retail Parking Lot Sealcoating & Heavy Traffic Line Marking",
      badge: "Retail Center Partner",
      logoText: "Hobby Lobby",
      image: "/images/commercial_brands/hobby-lobby-real.jpg"
    },
    {
      name: "Firestone Auto Care Bays",
      locations: "Richmond & Tri-Cities Service Lots",
      services: "Subgrade Base Construction & Heavy 4-Inch Service Bay Aprons",
      badge: "Automotive Partner",
      logoText: "Firestone",
      image: "/images/commercial_brands/firestone-real.jpg"
    },
    {
      name: "Tractor Supply Co.",
      locations: "Mid-Atlantic Retail Outlets",
      services: "Heavy Loading Dock Asphalt Paving & Equipment Aprons",
      badge: "Commercial Partner",
      logoText: "Tractor Supply",
      image: "/images/commercial_brands/tractor-supply-real.jpg"
    },
    {
      name: "Arby's Drive-Thru & Lot",
      locations: "QSR Commercial Corridors",
      services: "After-Hours Night Milling, Patch Repair & Fast-Cure Sealcoat",
      badge: "Commercial Partner",
      logoText: "Arby's",
      image: "/images/commercial_brands/arbys-real.jpg"
    },
    {
      name: "CVS Pharmacy Parking",
      locations: "Pharmacy Retail Corridors",
      services: "Handicap ADA Access Ramp Paving & Parking Lot Resurfacing",
      badge: "Retail Healthcare",
      logoText: "CVS",
      image: "/images/commercial_brands/cvs-real.jpg"
    },
    {
      name: "Walgreens ADA Upgrades",
      locations: "Commercial Outparcels",
      services: "Concrete Handicap Access Ramps, ADA Blue Tactiles & Curb Cuts",
      badge: "Retail Healthcare",
      logoText: "Walgreens",
      image: "/images/commercial_brands/walgreens-real.jpg"
    },
    {
      name: "Food Lion Supermarket",
      locations: "Supermarket Plazas",
      services: "Full Parking Lot Scanning, Subbase Stabilization & Paving",
      badge: "Supermarket Anchor",
      logoText: "Food Lion",
      image: "/images/commercial_brands/food-lion-real.jpg"
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
            The Work Itself
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Commercial asphalt paving, night milling, sealcoating and ADA compliance,
            self-performed. The figures above are what that came to on one national
            franchise programme; the work below is what it looked like on the ground.
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {brands.map((b, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl hover:border-amber-500/40 transition group flex flex-col">
              <div className="relative aspect-[16/10] w-full bg-slate-950 p-2 flex items-center justify-center overflow-hidden border-b border-slate-800/60">
                <SmartImage
                  src={b.image}
                  alt={`${b.name} paving project`}
                  label={b.name}
                  className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

            </div>
          ))}
        </div>

        {/* E-E-A-T Schema Trust Banner & National Award */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Top 75 Paving Contractor Award */}
          <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-2xl p-6 flex items-start gap-4 hover:border-amber-500/60 transition">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 inline-block mb-2">
                NATIONAL RANKING
              </div>
              <h4 className="text-slate-100 font-extrabold text-lg mb-1">Top 75 Paving Contractor in the U.S.</h4>
              <p className="text-slate-400 text-sm mb-3">
                Officially ranked among the Nation's Top 75 Paving Contractors by *Pavement Maintenance & Reconstruction* Magazine (85% Commercial / 90% Parking Lots focus).
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">Paving: 55%</span>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">Sealcoat: 20%</span>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">Repair: 15%</span>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">Striping: 10%</span>
              </div>
            </div>
          </div>

          {/* Google EEAT Verification */}
          <div className="bg-gradient-to-r from-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-6 flex items-start gap-4 hover:border-amber-500/60 transition">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 inline-block mb-2">
                GOOGLE E-E-A-T
              </div>
              <h4 className="text-slate-100 font-extrabold text-lg mb-1">Google E-E-A-T Verified Authority</h4>
              <p className="text-slate-400 text-sm mb-3">
                Commercial references backed by real job site photo proofs, certified compaction specs, and a 4.9/5.0 rating across 100+ commercial projects.
              </p>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>USDOT 2568168 &middot; General Liability Protected</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
