import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Williamsburg VA | Commercial Paving',
  description: 'Heavy commercial asphalt and precision paving for Williamsburg, VA. Get an instant AI Satellite estimate for your commercial lot. J. Worden Paving.',
  keywords: 'Williamsburg VA Paving Contractor, Williamsburg Commercial Asphalt, J Worden Paving',
}

export default function WilliamsburgPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Williamsburg, VA</span></h1>
          <p>National-Grade Commercial Asphalt Engineering for Williamsburg and the Peninsula.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC brings heavy-duty commercial asphalt paving down the I-64 corridor to Williamsburg, Virginia. We execute high-volume commercial milling, ADA-compliant structural overlays, and long-term pavement preservation for the massive hospitality, retail, and HOA complexes throughout the Historic Triangle. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving The Historic Triangle</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Williamsburg's massive hospitality sector and high-end retail centers demand flawless pavement infrastructure. Potholes, faded line striping, and alligator cracking severely damage the guest experience and present massive trip-hazard liabilities.
            </p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              We deploy our heavy fleet to Williamsburg to execute phased, overnight commercial paving. This ensures zero downtime for your retail or hotel operations while we install deep-strength VDOT-spec Hot Mix Asphalt capable of supporting endless tour bus and logistics traffic.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Williamsburg Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the precise square footage and HMA tonnage required for your Williamsburg commercial property, bypassing manual estimates and eliminating material waste.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Williamsburg AI Estimation</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Williamsburg property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Williamsburg" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
