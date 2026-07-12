import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Windsor Farms | Estate Paving',
  description: 'Luxury estate paving for Windsor Farms in Richmond, VA. We build highly-engineered architectural asphalt driveways for high-ARV properties. Get an AI scan.',
  keywords: 'Windsor Farms Paving Contractor, Windsor Farms Asphalt, Estate Driveways Richmond, J Worden Paving',
}

export default function WindsorFarmsPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Windsor Farms</span></h1>
          <p>Architectural Estate Driveway Paving for Richmond&apos;s Premier Neighborhood.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC engineers luxury estate driveways for the high-ARV properties of Windsor Farms in Richmond, Virginia. A failing, cracked, builder-grade driveway severely damages the curb appeal of a multi-million dollar estate. We do not patch. We excavate, engineer deep-strength stone bases, and pave with VDOT-spec Hot Mix Asphalt to ensure your estate maintains its maximum valuation. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Elevating Windsor Farms Estates</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              We bring our heavy commercial iron to luxury neighborhoods, delivering compaction densities that lightweight residential contractors cannot achieve. Our laser-guided grading ensures that water flows perfectly into local drainage systems, rather than pooling on your driveway or threatening historic foundations.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the exact dimensions of your Windsor Farms estate driveway, providing a mathematically exact quote and allowing us to dispatch our heavy fleet with perfect material precision.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Windsor Farms AI Estimation</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Windsor Farms property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Windsor Farms" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
