import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in The Fan District | Historic Paving',
  description: 'Precision asphalt paving for The Fan District in Richmond. We specialize in historic alleyways, tight urban clearances, and luxury driveway restorations.',
  keywords: 'The Fan District Paving Contractor, The Fan Asphalt, Historic Richmond Paving, J Worden Paving',
}

export default function FanDistrictPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>The Fan District</span></h1>
          <p>Historic Paving Specialists for Richmond&apos;s Premier Urban Neighborhood.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides highly specialized asphalt paving for The Fan District in Richmond, Virginia. Paving in The Fan requires navigating century-old root systems, extremely tight alleyway clearances, and historic cobble integration. Standard contractors fail here. We deploy compact, heavy-compaction equipment designed specifically for historic urban infrastructure. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Historic Richmond</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              The Fan District presents unique engineering challenges. Subgrades are often compromised by 100-year-old oak tree roots, and water drainage must be perfectly calculated to protect historic brick foundations. We specialize in custom water diversion systems and compact vibratory rolling to achieve maximum asphalt density in incredibly tight spaces.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Advantage in The Fan</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the exact dimensions of your Fan District parking pad, driveway, or commercial alleyway, providing a mathematically exact quote without needing an on-site visit.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Fan District AI Estimation</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Fan District property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Fan District" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
