import React from 'react'
import { Link } from 'react-router-dom'
import { Factory, Building2, Truck, Ruler, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import SmartImage from '@/components/SmartImage'
import { trackPhoneClick } from '@/lib/analytics'
import { legacyPortfolioImages } from '@/data/legacyPortfolio'

const CONCRETE_SERVICES = [
  {
    title: 'Commercial Sidewalks & Curbs',
    description: 'Precision-formed ADA compliant sidewalks, dumpster pads, and extruded curbing for commercial shopping centers and retail outlets.',
    icon: <Building2 className="w-5 h-5 text-brand-amber" />
  },
  {
    title: 'Loading Docks & Industrial Pads',
    description: 'High-strength reinforced concrete slabs designed for heavy freight, forklifts, and industrial machinery vibration.',
    icon: <Factory className="w-5 h-5 text-brand-amber" />
  },
  {
    title: 'Decorative Stamped Concrete',
    description: 'Elevate your property with stamped and colored concrete patterns including slate, brick, and natural stone textures.',
    icon: <Ruler className="w-5 h-5 text-brand-amber" />
  },
  {
    title: 'Universal Supply Chain',
    description: 'Direct relationships with local aggregate and ready-mix plants ensures consistent supply even during peak construction season.',
    icon: <Truck className="w-5 h-5 text-brand-amber" />
  }
]

export default function VirginiaConcrete() {
  const concreteImages = legacyPortfolioImages.filter(img => img.category === 'Commercial' || img.category === 'Professional').slice(0, 3);

  return (
    <div className="min-h-screen bg-brand-navy">
      <SEO 
        title="Concrete Services in Virginia | Commercial & Industrial Flatwork"
        description="J. Worden & Sons provides expert concrete services across Virginia. Loading docks, sidewalks, curbs, and industrial pads. 40+ years of masonry excellence."
        canonical="/virginia-concrete"
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Masonry & Concrete Division
              </span>
              <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight">
                Virginia's <span className="text-brand-amber text-outline-amber">Concrete</span> Authority.
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-xl">
                From reinforced industrial slabs to high-traffic commercial sidewalks, we deliver the structural integrity your business depends on. Vertical integration ensures we control the supply chain from aggregate to finish.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/quote" className="btn-primary py-4 px-8">Schedule Concrete Scan</Link>
                <button onClick={() => trackPhoneClick('concrete-page')} className="btn-outline py-4 px-8 text-white">Call Specialist</button>
              </div>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <SmartImage src={concreteImages[0]?.url || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80'} className="rounded-2xl w-full h-64 object-cover border border-white/10" alt="Concrete Work" />
                <div className="bg-brand-amber p-6 rounded-2xl">
                  <p className="text-brand-navy font-black text-3xl">4000+</p>
                  <p className="text-brand-navy/80 font-bold uppercase text-xs tracking-tighter">PSI Minimum Strength</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <ShieldCheck className="w-8 h-8 text-brand-amber mb-2" />
                  <p className="text-white font-bold">Reinforced</p>
                  <p className="text-white/40 text-xs">Rebar & Fiber Mesh Ready</p>
                </div>
                <SmartImage src={concreteImages[1]?.url || 'https://images.unsplash.com/photo-1517646282162-63234d8e78f9?auto=format&fit=crop&q=80'} className="rounded-2xl w-full h-80 object-cover border border-white/10" alt="Concrete Pouring" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-white/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {CONCRETE_SERVICES.map((service, idx) => (
              <div key={idx} className="bg-brand-navy/50 border border-white/10 p-8 rounded-3xl hover:border-brand-amber/40 transition-all group">
                <div className="bg-brand-amber/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-white font-black text-xl mb-3 tracking-tight">{service.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-20 text-center px-4">
        <div className="max-w-4xl mx-auto bg-brand-amber rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 size={120} />
          </div>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl mb-8 leading-tight">
            "We handle the concrete so your business has a foundation that never quits."
          </h2>
          <p className="text-brand-navy/60 font-bold uppercase tracking-widest text-sm">
            — J. Worden & Sons Professional Concrete Division
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
