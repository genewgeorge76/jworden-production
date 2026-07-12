import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Chesterfield VA | J. Worden Paving',
  description: 'Heavy commercial asphalt and precision residential driveway paving for Chesterfield County, Virginia. Get an instant AI Satellite estimate today.',
  keywords: 'Chesterfield VA Paving Contractor, Chesterfield Commercial Asphalt, Residential Driveways Chesterfield, J Worden Paving',
}

export default function ChesterfieldPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Chesterfield, VA</span></h1>
          <p>Massive Fleet Capability for Chesterfield County Commercial Hubs & Estates.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC deploys commercial-grade Hot Mix Asphalt (HMA) paving across Chesterfield County, VA. We specialize in high-volume retail center milling and resurfacing, HOA neighborhood roads, and high-ARV residential driveways. Our heavy iron fleet achieves 95%+ compaction density, ensuring your Chesterfield pavement survives 80,000lb truck traffic and extreme freeze-thaw cycles. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Engineered for Chesterfield County</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Chesterfield County is experiencing explosive commercial and residential growth. This growth requires infrastructure built to last. When retail centers along Hull Street or Midlothian Turnpike require structural resurfacing, they don&apos;t hire lightweight contractors. They hire J. Worden & Sons.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', margin: '40px 0' }}>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Commercial Resurfacing</h3>
                <p style={{ color: '#555' }}>We execute rapid, phased milling and Hot Mix Asphalt overlays for Chesterfield shopping centers to ensure zero downtime for your tenants.</p>
              </div>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>HOA & Residential</h3>
                <p style={{ color: '#555' }}>We provide highly engineered asphalt paving, hot-pour crack sealing, and industrial emulsion sealcoating to protect Chesterfield HOA property values.</p>
              </div>
            </div>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Chesterfield Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our massive fleet allows us to tackle the largest commercial lots in the county, while our proprietary AI Satellite scanning provides you with an instant, mathematically exact estimate without the traditional 7-day wait time.
            </p>

          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Chesterfield AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Bypass the wait. Input your Chesterfield property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Chesterfield" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />

    </main>
  )
}
