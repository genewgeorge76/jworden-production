import type { Metadata } from 'next'
import { HardHat, ShieldCheck, Trophy, MapPin } from 'lucide-react'
import Image from 'next/image'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Our Legacy | 4th Generation Appalachian Paving | Blue Ridge Estate Paving',
  description: 'Founded in 1984, Blue Ridge Estate Paving is a 4th-generation family business specializing in heavy-duty structural paving across the Virginia Highlands.',
}

export default function OurLegacyPage() {
  return (
    <main>
      {/* High-End Dynamic Hero */}
      <section className="hero" style={{ backgroundImage: "url('/images/machinery.png')" }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(rgba(5,5,5,0.7), rgba(5,5,5,0.95))' }}></div>
        <div className="hero-content">
          <div style={{ display: 'inline-block', border: '1px solid var(--estate-gold)', padding: '5px 15px', color: 'var(--estate-gold)', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
            Established 1984
          </div>
          <h1 style={{ fontSize: '5rem', marginBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>4 Generations of <br/><span style={{ color: 'var(--powerhouse-red)' }}>Appalachian Engineering.</span></h1>
          <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.4rem' }}>
            We aren't a pop-up paving crew. We are a family lineage dedicated to building structural pavement designed to outlast the mountains.
          </p>
        </div>
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--bg-primary)' }}>
        <div style={{ flex: '1 1 50%', padding: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 className="gold-text" style={{ fontSize: '3rem', marginBottom: '30px', letterSpacing: '-1px' }}>Born in the Highlands.</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.9', marginBottom: '20px' }}>
            Most paving contractors stay in the city where the ground is flat and the subgrades are forgiving. We do the exact opposite. 
          </p>
          <div className="glass-panel" style={{ padding: '30px', borderLeft: '4px solid var(--powerhouse-red)', marginBottom: '30px' }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--pure-white)', fontStyle: 'italic', margin: 0, lineHeight: '1.8' }}>
              "The Highlands of Virginia are my backyard. I have been paving these mountain roads since I was 15 years old, working directly alongside my grandfather. We learned early on that you cannot cut corners on elevation."
            </p>
            <p style={{ color: 'var(--estate-gold)', fontWeight: 'bold', marginTop: '10px' }}>— GW George, Founder</p>
          </div>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.9', marginBottom: '20px' }}>
            Operating as a division of <strong>J. Worden & Sons Paving LLC</strong>, we carry over 40 years of heavy civil construction experience into the residential and commercial markets of the Shenandoah Valley and Roanoke regions. 
          </p>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.9' }}>
            We know exactly how the rapid temperature drops, extreme moisture, and intense freeze-thaw cycles of the Appalachian climate destroy standard pavement. That is why we exclusively build heavy-duty, 80,000lb-rated foundations before a single drop of asphalt is ever laid.
          </p>
        </div>
        <div style={{ flex: '1 1 50%', background: "url('/images/driveway.png') center/cover" }}></div>
      </section>

      {/* Trust Strip */}
      <section className="trust-strip" style={{ background: 'var(--powerhouse-red)', padding: '40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', gap: '10px' }}>
            <Trophy size={40} />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Founded in 1984</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', gap: '10px' }}>
            <HardHat size={40} />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>4th Generation Engineers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', gap: '10px' }}>
            <MapPin size={40} />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Native to the Highlands</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', gap: '10px' }}>
            <ShieldCheck size={40} />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Fully Licensed & Insured</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 40px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3.5rem', color: 'var(--pure-white)', letterSpacing: '-1px', marginBottom: '20px' }}>Ready to work with the best?</h2>
          <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            Let our family engineer a permanent, structural solution for your property. Use our AI Satellite Estimation tool below to get started instantly.
          </p>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'left' }}>
            <AIEstimationForm location="The Virginia Highlands" />
          </div>
        </div>
      </section>

    </main>
  )
}
