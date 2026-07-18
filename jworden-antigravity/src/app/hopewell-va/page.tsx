import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Hopewell VA | J. Worden Paving',
  description: 'Industrial asphalt paving for Hopewell, Virginia. We build structural commercial parking lots for chemical and manufacturing hubs. Get an AI scan.',
  keywords: 'Hopewell VA Paving Contractor, Hopewell Industrial Asphalt, Commercial Paving Hopewell, J Worden Paving',
}

export default function HopewellPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356f73?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Hopewell, VA</span></h1>
          <p>Industrial-Grade Asphalt Engineering for Hopewell Manufacturing & Logistics.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides elite industrial Hot Mix Asphalt (HMA) paving for Hopewell, Virginia. Hopewell is an industrial powerhouse heavily saturated with chemical plants, manufacturing facilities, and relentless 80,000lb commercial trucking. Standard asphalt fails rapidly here. We engineer deep-strength VDOT BM-25.0 base mixes to withstand extreme loads and caustic environments. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Hopewell's Industrial Sector</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Hopewell requires a specialized approach to paving. Industrial subgrades subjected to constant heavy trucking will pump and rut if they are not compacted to absolute refusal. We deploy massive multi-ton vibratory rollers to achieve 95%+ compaction density across your industrial facility.
            </p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              We also execute deep-profile milling and chemical-resistant emulsion sealcoating to protect your existing infrastructure from petroleum spills and UV oxidation.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Hopewell Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the precise square footage required for your massive Hopewell industrial lot, providing you with a mathematically exact quote without disrupting your supply chain operations.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Hopewell AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Hopewell facility address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Hopewell" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
