import { createFileRoute } from '@tanstack/react-router';
import ContactForm from '../components/ContactForm';

export const Route = createFileRoute('/estimator')({
  component: () => (
    <main className="min-h-screen bg-premium-black grain text-white font-sans text-left">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-[#1a1a1a] border-b-[15px] border-[#ffcc00] overflow-hidden text-left">
        <div className="max-w-7xl mx-auto relative z-10 text-left">
          <span className="bg-[#ffcc00] text-black px-6 py-1.5 font-black uppercase text-xs tracking-[0.4em] mb-8 inline-block shadow-2xl">
            Free · No Obligation · Same-Day Response
          </span>
          <h1 className="text-8xl font-black uppercase text-[#ffcc00] leading-[0.9] tracking-tighter text-left">
            FREE <br /> <span className="text-white italic">ESTIMATOR</span>
          </h1>
          <p className="text-3xl text-gray-200 italic font-bold mt-10 max-w-4xl leading-snug text-left">
            Get a professional estimate from J. Worden &amp; Sons — free, fast, and backed by 40 years of 4th-generation paving expertise.
          </p>
        </div>
      </section>

      {/* What We Estimate */}
      <section className="py-24 px-6 bg-black text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-4xl font-black uppercase text-white mb-8">
              We Estimate <span className="text-[#ffcc00]">Everything</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                'Parking Lots', 'Driveways', 'Sealcoating', 'Line Striping',
                'Asphalt Repair', 'Curb &amp; Gutter', 'Sidewalks', 'ADA Ramps',
                'Masonry', 'Concrete', 'Commercial Roofing', 'Site Grading',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-gray-300 font-bold text-sm">
                  <span className="text-[#ffcc00]">✓</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </div>
              ))}
            </div>

            <div className="mt-12 bg-[#1a1a1a] border-l-[6px] border-[#ffcc00] p-8">
              <h3 className="text-2xl font-black text-[#ffcc00] uppercase mb-4">The Worden Promise</h3>
              <ul className="space-y-3 text-gray-200 font-bold">
                <li>→ Free site visit within 48 hours for qualified projects</li>
                <li>→ Detailed line-item proposals with spec references</li>
                <li>→ 96% Marshall compaction minimum — in writing</li>
                <li>→ VDOT-grade structural stone base — standard</li>
                <li>→ $9/ton oil-price buffer built into every quote</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-black uppercase text-white mb-8">Request Your Estimate</h2>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Quick Call */}
      <section className="py-24 px-6 bg-[#ffcc00]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-black uppercase text-black mb-6">Prefer to Call?</h2>
          <p className="text-xl text-black/70 font-bold mb-10 max-w-2xl mx-auto">Our estimating team answers 7 days a week for urgent commercial and government projects.</p>
          <a href="tel:8044461296" className="inline-block bg-black text-[#ffcc00] font-black uppercase tracking-widest px-12 py-5 text-xl hover:bg-zinc-900 transition-colors">
            804-446-1296
          </a>
        </div>
      </section>
    </main>
  ),
});
