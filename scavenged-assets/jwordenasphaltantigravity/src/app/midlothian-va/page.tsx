import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Midlothian VA | J. Worden Paving',
  description: 'Premium asphalt paving for Midlothian Virginia. We build structural commercial parking lots and high-ARV residential driveways using heavy iron. Get an AI scan.',
  keywords: 'Midlothian VA Paving Contractor, Midlothian Commercial Asphalt, Residential Driveways Midlothian, J Worden Paving',
}

export default function MidlothianPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Midlothian, VA</span></h1>
          <p>Architectural Asphalt Driveways & Heavy Commercial Paving for Midlothian Estates and Retail.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC brings national-grade commercial paving standards to Midlothian, Virginia. Whether we are executing an overnight Hot Mix Asphalt overlay for a high-traffic retail center on Midlothian Turnpike, or excavating and rebuilding a million-dollar estate driveway in Salisbury or Hallsley, we deploy the exact same heavy-duty vibratory rollers and laser-guided grading systems. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Elevating Midlothian Property Values</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Midlothian features some of the highest After Repair Value (ARV) residential estates in the Richmond metro area. A failing, cracked, builder-grade driveway severely damages that curb appeal. We do not patch or "paint" driveways. We engineer architectural asphalt solutions built on 6-inch structural stone bases to ensure your estate maintains its value.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', margin: '40px 0' }}>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Estate Driveways</h3>
                <p style={{ color: '#555' }}>We bring our heavy commercial iron to luxury Midlothian neighborhoods, delivering compaction densities that lightweight residential contractors cannot achieve.</p>
              </div>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Midlothian Turnpike Retail</h3>
                <p style={{ color: '#555' }}>Our massive fleet executes phased, overnight commercial milling and paving for retail centers, ensuring zero downtime for your tenants.</p>
              </div>
            </div>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Midlothian Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Skip the week-long wait for a manual estimate. Our proprietary AI Satellite scanning can instantly calculate the precise square footage, grade variations, and required HMA tonnage for your Midlothian property, ensuring pinpoint accuracy.
            </p>

          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Midlothian AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Bypass the wait. Input your Midlothian property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Midlothian" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />

    </main>
  )
}
