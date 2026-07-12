import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in 23221 | Carytown & West End',
  description: 'Premium historic residential paving and commercial asphalt for the 23221 zip code, Carytown, and the near West End of Richmond. J. Worden & Sons.',
  keywords: '23221 Paving Contractor, Carytown Paving, West End Richmond Asphalt, J Worden Paving',
}

export default function CarytownPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>23221</span></h1>
          <p>Historic Residential Estates & Boutique Commercial Paving in Carytown and the Near West End.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides specialized, premium asphalt paving for the highly concentrated 23221 zip code, encompassing Carytown, the Museum District, and the near West End of Richmond. We understand the unique spatial constraints and historic drainage profiles of these properties. We utilize VDOT-approved SM-9.5A surface mixes and precision laser-guided grading to ensure high-end residential estates and boutique commercial alleys drain perfectly while elevating the property's architectural aesthetic. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Historic 23221 Properties</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              The 23221 zip code (Carytown, Museum District, Near West End) presents unique paving challenges that standard volume contractors simply cannot handle. The properties here feature historic foundations, tight alleyway access, and complex legacy drainage systems. You cannot just "pave over" these lots without risking massive water intrusion into historic basements.
            </p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              <strong>J. Worden & Sons</strong> brings mathematical precision to 23221. We execute millimeter-accurate laser grading to ensure all hydrology (water runoff) is directed strictly toward municipal storm drains and completely away from your high-value historic foundation.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', margin: '40px 0' }}>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Boutique Commercial</h3>
                <p style={{ color: '#555' }}>We pave the tight, high-traffic commercial lots and alleyways behind Carytown retail centers, executing overnight to avoid disrupting daytime commerce.</p>
              </div>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>High-ARV Residential</h3>
                <p style={{ color: '#555' }}>A cracked, failing driveway destroys the curb appeal of a million-dollar West End estate. We install structural, deep-black architectural asphalt that vastly increases ARV.</p>
              </div>
            </div>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden 23221 Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Unlike generic contractors who use manual measuring wheels, our proprietary AI Satellite scanning can calculate the exact square footage and pitch of your Carytown property from orbit, allowing us to provide you with an exact, itemized estimate instantly.
            </p>

          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>23221 AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Bypass the wait. Input your 23221 property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Virginia" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />

    </main>
  )
}
