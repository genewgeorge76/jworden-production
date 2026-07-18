import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Chester VA | J. Worden Paving',
  description: 'Heavy commercial asphalt and precision residential driveway paving in Chester, Virginia. Get an instant AI Satellite estimate today.',
  keywords: 'Chester VA Paving Contractor, Chester Commercial Asphalt, Residential Driveways Chester, J Worden Paving',
}

export default function ChesterPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Chester, VA</span></h1>
          <p>The Home Base of J. Worden & Sons. Elite Asphalt Engineering for Chester & Enon.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC operates heavily in Chester, Virginia. Our massive fleet of vibratory rollers, milling machines, and laser-guided pavers deploy instantly to Chester commercial hubs and residential neighborhoods. We utilize 80,000lb-rated base engineering and high-temperature VDOT-spec Hot Mix Asphalt to ensure unmatched longevity. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Our Home Territory</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              We know Chester. We know the exact soil composition of the subgrades in Enon, and we know the exact logistics required to pave the high-volume industrial corridors off I-95 and Route 1. When you hire J. Worden & Sons in Chester, you are getting the absolute maximum level of asphalt engineering from the premier local powerhouse.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', margin: '40px 0' }}>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Industrial Logistics</h3>
                <p style={{ color: '#555' }}>We engineer heavy-duty HMA overlays and execute deep-profile milling for the massive warehouses and logistics hubs operating in Chester.</p>
              </div>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Residential Driveways</h3>
                <p style={{ color: '#555' }}>We tear out failing builder-grade driveways in Chester neighborhoods and replace them with 6-inch structural stone bases and VDOT-spec asphalt.</p>
              </div>
            </div>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Chester Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Skip the week-long wait for a manual estimate. Our proprietary AI Satellite scanning can instantly calculate the precise square footage and HMA tonnage required for your Chester property, ensuring perfect mathematical accuracy and zero material waste.
            </p>

          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Chester AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Bypass the wait. Input your Chester property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Chester" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />

    </main>
  )
}
