import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Scotts Addition | Commercial Paving',
  description: 'Industrial asphalt paving for Scotts Addition, Virginia. We build structural commercial parking lots for breweries, retail, and developments. Get an AI scan.',
  keywords: 'Scotts Addition Paving Contractor, Scotts Addition Industrial Asphalt, Commercial Paving Richmond, J Worden Paving',
}

export default function ScottsAdditionPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356f73?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Scott's Addition</span></h1>
          <p>Commercial Asphalt Engineering for Richmond&apos;s Fastest Growing Hub.</p>
        </div>
      </section>

      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC engineers heavy-duty Hot Mix Asphalt (HMA) for the massive commercial developments, breweries, and retail centers operating throughout Scott's Addition in Richmond, Virginia. We execute deep-profile milling and lay structural asphalt capable of enduring relentless urban traffic and commercial delivery trucks. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Paving Scott's Addition Commercial Hubs</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Scott's Addition is a massive artery for commercial retail and high-density residential development. The asphalt infrastructure required to support operations here requires true engineering. We deploy to Scott's Addition to execute structural base remediation. We excavate failing industrial subgrades, bridge soft soils, and pave with VDOT BM-25.0 base mixes to ensure your commercial parking lot survives extreme urban traffic.
            </p>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>The J. Worden Advantage</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Our proprietary AI Satellite scanning instantly calculates the precise square footage and HMA tonnage required for your Scott's Addition commercial property, providing you with a mathematically exact quote without disrupting your operations.
            </p>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Scott's Addition AI Estimation</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Input your Scott's Addition property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Scott's Addition" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />
    </main>
  )
}
