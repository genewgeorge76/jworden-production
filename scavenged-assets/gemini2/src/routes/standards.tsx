import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/standards')({
  component: () => (
    <main className="min-h-screen bg-premium-black grain font-sans text-white">
      {/* HERO SECTION */}
      <section className="py-24 px-6 bg-[#1a1a1a] border-b-[10px] border-[#ffcc00]">
        <div className="max-w-7xl mx-auto">
          <span className="bg-[#ffcc00] text-black px-4 py-1 font-black uppercase text-sm tracking-[0.3em] mb-6 inline-block">
            Consumer Protection & Specs
          </span>
          <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6 text-[#ffcc00]">
            Virginia Engineered <br /> Standards
          </h1>
          <p className="text-2xl font-bold uppercase italic text-gray-200 max-w-4xl leading-tight">
            We don't do "bait and switch" paving. Choose your structural tier based on your budget and timeline. Every spec is in writing.
          </p>
        </div>
      </section>

      {/* THE 3 TIERS OF PAVEMENT */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-5xl font-black uppercase mb-16 text-center tracking-tighter">The 3 Structural Tiers</h2>
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* TIER 1: RESALE OVERLAY */}
          <div className="bg-[#1a1a1a] border-t-8 border-gray-600 p-8 shadow-2xl flex flex-col">
            <h3 className="text-3xl font-black uppercase mb-2 text-gray-300">Tier 1: Resale</h3>
            <p className="text-[#ffcc00] font-bold uppercase text-sm tracking-widest mb-6">The Budget / Mover Option</p>
            <p className="text-gray-200 mb-8 flex-grow">
              Ideal for property "flip" projects or quick surface refreshes. Includes a 1.5" surface course overlay with targeted patching.
            </p>
          </div>

          {/* TIER 2: RESIDENTIAL STANDARD */}
          <div className="bg-[#1a1a1a] border-t-8 border-[#ffcc00] p-8 shadow-2xl flex flex-col scale-105 z-10">
            <h3 className="text-3xl font-black uppercase mb-2 text-white">Tier 2: Standard</h3>
            <p className="text-[#ffcc00] font-bold uppercase text-sm tracking-widest mb-6">The 15-20 Year Driveway</p>
            <p className="text-gray-200 mb-8 flex-grow">
              Our most popular choice. Full 2" compacted surface over a 6" stone base. Perfect for Richmond's clay soil.
            </p>
          </div>

          {/* TIER 3: HEAVY DUTY */}
          <div className="bg-[#1a1a1a] border-t-8 border-white p-8 shadow-2xl flex flex-col">
            <h3 className="text-3xl font-black uppercase mb-2 text-gray-300">Tier 3: Estate</h3>
            <p className="text-[#ffcc00] font-bold uppercase text-sm tracking-widest mb-6">The "Forever" Foundation</p>
            <p className="text-gray-200 mb-8 flex-grow">
              Double-lift paving (3" total) over reinforced stone. Designed for heavy equipment, RVs, and maximum longevity.
            </p>
          </div>
        </div>
      </section>

      {/* LIABILITY & COMPLIANCE SECTION */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-gray-800">
        <div className="bg-[#1a1a1a] p-10 border-l-8 border-red-600 shadow-2xl">
          <h2 className="text-4xl font-black uppercase text-white mb-6 italic">
            Liability Protection: <span className="text-[#ffcc00]">Striping & ADA</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            We don't just paint lines; we protect your interests as a business owner. By utilizing <span className="text-white font-bold">TTP-1952 federal specification paint</span> and strictly adhering to the <a href="https://www.ada.gov/law-and-regs/design-standards/2010-stds/" target="_blank" rel="noreferrer" className="text-[#ffcc00] underline">2010 ADA Standards</a>, we shield you from "drive-by" lawsuits and non-compliance fines.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-black/50 p-6 border border-gray-800">
              <h4 className="text-[#ffcc00] font-black uppercase mb-2">Industrial Materials</h4>
              <p className="text-sm text-gray-200">Exclusively using <a href="https://neyra.com/" target="_blank" rel="noreferrer" className="underline">Neyra Industries</a> and <a href="https://sealmaster.net/" target="_blank" rel="noreferrer" className="underline">SealMaster</a> high-solids emulsions. No watered-down mixes.</p>
            </div>
            
            <div className="bg-black/50 p-6 border border-gray-800">
              <h4 className="text-[#ffcc00] font-black uppercase mb-2">Legal Compliance</h4>
              <p className="text-sm text-gray-200">Every handicap stall and van-accessible route is measured to the inch to meet federal mandates.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  ),
});
