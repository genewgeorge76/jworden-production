import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Petersburg VA | J. Worden Paving',
  description: 'Industrial asphalt paving for Petersburg, Virginia. We build structural commercial parking lots for historic hubs and manufacturing. Get an AI scan.',
  keywords: 'Petersburg VA Paving Contractor, Petersburg Industrial Asphalt, Commercial Paving Petersburg, J Worden Paving',
}

export default function PetersburgPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Petersburg, VA</span></h1>
          <p>Industrial-Grade Asphalt Engineering for Petersburg Manufacturing & Historic Districts.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides elite commercial Hot Mix Asphalt (HMA) paving for Petersburg, Virginia. From historic downtown overlays to heavy industrial manufacturing hubs off I-85, we engineer deep-strength VDOT asphalt mixes to withstand extreme loads and urban traffic. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Petersburg's Industrial & Historic Sectors</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Petersburg requires a contractor who understands both historic urban drainage and massive industrial subgrades. We deploy massive multi-ton vibratory rollers to achieve 95%+ compaction density across industrial facilities, and we utilize laser-guided grading to ensure water never compromises historic foundations in the urban core.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Petersburg Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the precise square footage required for your Petersburg lot, providing you with a mathematically exact quote without disrupting operations.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Petersburg AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Petersburg facility address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Petersburg" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
