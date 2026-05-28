import React from 'react'
import { CheckCircle2, Construction, Layers, Droplets } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import SmartImage from '@/components/SmartImage'
import { trackPhoneClick } from '@/lib/analytics'

const MILLING_USE_CASES = [
  {
    title: 'Recycled Asphalt (RAP)',
    description: '100% recycled asphalt pavement crushed to spec. Bonds under solar heat to create a hard-packed, dust-free lane at 40% the cost of hot-mix.',
    icon: <Layers className="w-5 h-5" />
  },
  {
    title: 'Coated Millings',
    description: 'Our proprietary application: Fresh millings combined with a heavy coat of liquid bituminous binder. The bridge between gravel and full paving.',
    icon: <Droplets className="w-5 h-5" />
  },
  {
    title: 'Asphalt Fines & Screenings',
    description: 'Fine-mesh recycled material perfect for walking paths, horse arenas, and base stabilization. Heavily compacted for an ultra-smooth finish.',
    icon: <Construction className="w-5 h-5" />
  }
]

export default function MillingsAndFines() {
  const title = 'Asphalt Millings & Recycled Pavement | Private Lanes & Commercial Bases'
  const description = 'Precision-graded asphalt millings, coated millings, and fine-graded recycled pavement for Virginia roads. Dust-free, heavy-load stable, and budget-friendly.'

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} canonicalPath="/millings-fines" />
      <Navbar />

      <section className="relative pt-32 pb-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-display text-primary text-xs tracking-widest uppercase mb-4">Precision Recycling Division</p>
          <h1 className="font-display font-black text-5xl md:text-8xl uppercase tracking-tighter leading-[0.9] mb-8">
            Asphalt Millings <br /> & Recycled Base
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed mb-10">
            For private lanes, farm roads, or large commercial staging areas—get the durability of asphalt 
            at a fraction of the cost. Including our exclusive <span className="text-primary font-black uppercase italic">Coated Millings</span> process.
          </p>
          <div className="flex gap-4">
            <a 
              href="tel:+18044461296" 
              onClick={() => trackPhoneClick('millings_hero')}
              className="premium-cta px-10 py-5 font-display font-bold text-sm tracking-widest uppercase text-primary-foreground"
            >
              Request A Load
            </a>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display font-black text-4xl uppercase mb-8">Why Choose <span className="text-primary">Recycled Pavement?</span></h2>
              <div className="space-y-6">
                {[
                  'Cost Reduction: Up to 60% savings vs standard asphalt hot-mix.',
                  'Dust Control: Heavily compacted millings eliminate gravel dust clouds.',
                  'Load Bearing: Superior base stability for heavy truck traffic and equipment.',
                  'Environmentally Friendly: 100% recycled material redirected from landfills.',
                  'Low Maintenance: Self-healing properties under high-heat summer conditions.'
                ].map((item, id) => (
                  <div key={id} className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <p className="text-lg text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="premium-panel p-2 rounded-3xl overflow-hidden shadow-2xl">
              <SmartImage 
                src="/work/imported/KFC/IMG_9514.JPG" 
                className="w-full h-[500px] object-cover rounded-2xl"
                alt="Quality Asphalt Millings"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight mb-16 text-center">Material Applications</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {MILLING_USE_CASES.map((item, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-background border border-border hover:border-primary transition-all">
                <div className="text-primary mb-6">{item.icon}</div>
                <h3 className="font-display font-black text-xl mb-4 uppercase tracking-wide">{item.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
