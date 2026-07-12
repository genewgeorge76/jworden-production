import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Mechanicsville VA | J. Worden Paving',
  description: 'Premium asphalt paving for Mechanicsville Virginia. We build structural commercial parking lots and highly-engineered residential driveways. Get an AI scan.',
  keywords: 'Mechanicsville VA Paving Contractor, Mechanicsville Commercial Asphalt, Residential Driveways Mechanicsville, J Worden Paving',
}

export default function MechanicsvillePaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Mechanicsville, VA</span></h1>
          <p>Architectural Asphalt Driveways & Commercial Paving for Mechanicsville Estates and Retail.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides elite commercial Hot Mix Asphalt (HMA) and specialized residential paving solutions for Mechanicsville, Virginia. From massive retail corridors on Route 360 to high-acreage residential estates, we deploy heavy iron to ensure maximum compaction and structural durability. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Mechanicsville Properties</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Mechanicsville requires a contractor capable of scaling from dense commercial complexes to long, winding residential driveways. We engineer deep-strength stone bases to prevent washout and utilize laser-guided grading to ensure perfect water diversion away from your property.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the precise square footage required for your Mechanicsville commercial or residential property, providing you with a mathematically exact quote.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Mechanicsville AI Estimation</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Mechanicsville property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Mechanicsville" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
