import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Ashland VA | Commercial Paving',
  description: 'Heavy commercial asphalt and precision paving for Ashland, VA. Get an instant AI Satellite estimate for your retail center. J. Worden Paving.',
  keywords: 'Ashland VA Paving Contractor, Ashland Commercial Asphalt, J Worden Paving',
}

export default function AshlandPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Ashland, VA</span></h1>
          <p>Heavy Commercial Asphalt Engineering for the Center of the Universe.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides commercial-grade Hot Mix Asphalt (HMA) paving and high-end residential driveway construction for Ashland, Virginia. From historic Route 1 commercial corridors to rural estate roads, we utilize laser-guided grading and heavy compaction to ensure maximum pavement longevity. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Ashland, VA</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Whether we are milling and resurfacing a retail shopping center along Washington Highway or executing a full-depth reclamation on a rural Ashland estate driveway, we bring the exact same heavy iron to the job.
            </p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              We understand the specific subgrade challenges of Ashland's soil profiles and utilize VDOT-spec materials to ensure our asphalt withstands both heavy commercial truck traffic and severe Virginia freeze-thaw cycles.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Ashland Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the precise square footage and HMA tonnage required for your Ashland property, providing an accurate, instantly actionable quote.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Ashland AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Ashland property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Ashland" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
