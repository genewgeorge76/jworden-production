import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in New Kent VA | Commercial & Estates',
  description: 'Heavy commercial asphalt and luxury estate paving for New Kent County, VA. Get an instant AI Satellite estimate for your driveway or parking lot. J. Worden Paving.',
  keywords: 'New Kent VA Paving Contractor, New Kent Commercial Asphalt, Estate Driveways New Kent, J Worden Paving',
}

export default function NewKentPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>New Kent, VA</span></h1>
          <p>Structural Commercial Overlays and Luxury Estate Driveways in New Kent County.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides highly engineered asphalt paving solutions for New Kent County. We specialize in paving long rural estate driveways and structural overlays for expanding commercial and logistics hubs along the I-64 corridor. We utilize VDOT-approved SM-9.5A mixes to ensure maximum durability against subgrade shifting and severe weather. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving the I-64 Corridor</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              New Kent County is undergoing rapid expansion. With new commercial developments and luxury residential estates being built, the demand for true commercial-grade asphalt is critical. Standard "driveway" contractors do not possess the heavy iron required to achieve the 95%+ compaction densities needed to prevent premature pavement failure.
            </p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              <strong>J. Worden & Sons</strong> brings 80,000lb-capable base engineering to every project in New Kent. Whether we are paving a massive warehouse logistics hub or a long, winding estate driveway, we utilize laser-guided grading to ensure perfect water runoff and structural longevity.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden New Kent Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning can instantly calculate the precise square footage and Hot Mix Asphalt tonnage required for your New Kent property, bypassing the traditional week-long wait for an estimate.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>New Kent AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Bypass the wait. Input your New Kent property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="New Kent" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
