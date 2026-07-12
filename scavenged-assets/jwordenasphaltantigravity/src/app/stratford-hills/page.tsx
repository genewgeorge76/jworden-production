import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Stratford Hills | J. Worden Paving',
  description: 'Premium asphalt paving for Stratford Hills in Richmond, VA. We build highly-engineered residential driveways for sloped properties. Get an AI scan.',
  keywords: 'Stratford Hills Paving Contractor, Stratford Hills Asphalt, Estate Driveways Richmond, J Worden Paving',
}

export default function StratfordHillsPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Stratford Hills</span></h1>
          <p>Architectural Estate Driveway Paving for Sloped Richmond Properties.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC engineers luxury estate driveways for the steep, sloped properties of Stratford Hills in Richmond, Virginia. Paving near the James River requires mastery of water runoff and subgrade stabilization. We utilize VDOT-spec Hot Mix Asphalt and heavy vibratory rollers to ensure your driveway never washes out or fails under extreme weather. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Stratford Hills</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              The topography of Stratford Hills presents severe drainage challenges. If a driveway is not paved with a perfectly calculated slope, heavy rains will rapidly erode the subgrade and destroy the asphalt. We map the hydrology of your property to ensure perfect water diversion before laying our deep-strength stone bases.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the exact dimensions and grade variations of your Stratford Hills property, providing a mathematically exact quote.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Stratford Hills AI Estimation</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Stratford Hills property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Stratford Hills" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
