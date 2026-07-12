import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Powhatan VA | J. Worden Paving',
  description: 'Premium asphalt paving for Powhatan Virginia. We build structural commercial parking lots and highly-engineered rural estate driveways. Get an AI scan.',
  keywords: 'Powhatan VA Paving Contractor, Powhatan Commercial Asphalt, Residential Driveways Powhatan, J Worden Paving',
}

export default function PowhatanPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Powhatan, VA</span></h1>
          <p>Architectural Asphalt Driveways & Commercial Paving for Powhatan Estates and Retail.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides commercial-grade Hot Mix Asphalt (HMA) and specialized Tar & Chip (Macadam) paving solutions for Powhatan, Virginia. We engineer long rural estate driveways with massive 6-inch structural stone bases to prevent washout, and we execute high-density compaction for local commercial and retail centers along Route 60. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Powhatan Properties</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Powhatan features expansive rural estates with long, winding driveways that often suffer from severe water washout and subgrade failure. We specialize in mapping the hydrology of your property to ensure perfect water diversion before laying our VDOT-spec asphalt.
            </p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              For rural properties seeking a rustic aesthetic, we also offer highly engineered Tar and Chip paving, providing massive traction and a beautiful natural stone look.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Powhatan Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the precise square footage required for your long Powhatan driveway or commercial lot, providing you with a mathematically exact quote.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Powhatan AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Powhatan property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Powhatan" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
