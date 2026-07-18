import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in The Museum District | J. Worden Paving',
  description: 'Precision asphalt paving for the Museum District in Richmond. We specialize in historic alleyways, tight urban clearances, and luxury driveway restorations.',
  keywords: 'Museum District Paving Contractor, Museum District Asphalt, Historic Richmond Paving, J Worden Paving',
}

export default function MuseumDistrictPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>The Museum District</span></h1>
          <p>Historic Paving Specialists for Richmond&apos;s Cultural Epicenter.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides highly specialized asphalt paving for the Museum District in Richmond, Virginia. Paving in this dense, historic urban environment requires specialized equipment capable of achieving heavy commercial compaction within exceptionally tight alleyways and small residential parking pads without damaging century-old foundations. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving The Museum District</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              The Museum District presents unique engineering challenges. Subgrades are often severely compromised by massive oak tree roots, and water drainage must be perfectly calculated. We specialize in custom water diversion systems to protect historic brick foundations, executing perfect Hot Mix Asphalt installations in spaces standard contractors cannot even access.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the exact dimensions of your Museum District parking pad or commercial alleyway, providing a mathematically exact quote.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Museum District AI Estimation</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Museum District property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Museum District" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
