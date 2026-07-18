import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Top Asphalt Paving Contractor in Henrico VA & Short Pump',
  description: 'Commercial asphalt paving for Henrico County, Short Pump, and Glen Allen. Get an instant AI Satellite Scan for your parking lot or estate. J. Worden & Sons.',
  keywords: 'Henrico VA Paving Contractor, Short Pump Commercial Asphalt, Glen Allen Paving, J Worden Paving',
}

export default function HenricoPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving <span>Henrico, VA</span></h1>
          <p>Heavy Commercial Asphalt & Precision Residential Paving for Henrico, Short Pump, and Glen Allen.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides elite commercial Hot Mix Asphalt (HMA) paving and high-end residential driveway construction throughout Henrico County, Virginia, including the massive commercial retail hubs of Short Pump and Glen Allen. We utilize VDOT-approved SM-9.5A surface mixes and 80,000lb-rated subgrade compaction to ensure our parking lots and estate driveways withstand extreme heavy-duty traffic. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Commercial Dominance in Henrico</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              Henrico County, specifically the Short Pump and Glen Allen corridors, represents some of the most concentrated commercial real estate in Central Virginia. Massive retail shopping centers and corporate office parks cannot afford to shut down for a week while a legacy contractor guesses asphalt tonnage with a measuring wheel.
            </p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              <strong>J. Worden & Sons</strong> uses proprietary AI satellite topography to instantly estimate large commercial grids in Henrico. We deploy our heavy fleet overnight or in highly coordinated phases, ensuring zero disruption to your tenant operations. We build deep-strength asphalt systems designed for constant delivery truck traffic.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', margin: '40px 0' }}>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Short Pump Retail</h3>
                <p style={{ color: '#555' }}>We specialize in ADA-compliant milling, resurfacing, and re-striping for high-volume retail centers along West Broad Street.</p>
              </div>
              <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Glen Allen Corporate</h3>
                <p style={{ color: '#555' }}>We provide long-term pavement preservation (sealcoating and hot-pour crack repair) for massive corporate campuses in Innsbrook.</p>
              </div>
            </div>

            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>Henrico Residential Estates</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
              We bring our heavy commercial iron to residential driveways in Henrico's premier neighborhoods. If your current driveway is rutting or cracking, it is because the builder used thin, substandard base rock. We excavate, install a structural 6-inch #21A stone base, and lay VDOT-spec asphalt to drastically increase your property's After Repair Value (ARV).
            </p>

          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{ background: 'var(--carbon-black)', padding: '40px', borderRadius: '8px', borderTop: '4px solid var(--powerhouse-red)', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white', fontFamily: 'Bebas Neue' }}>Henrico AI Estimation Tool</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>Bypass the wait. Input your Henrico, Short Pump, or Glen Allen property address and our systems will begin an orbital scan immediately.</p>
              <AIEstimationForm location="Henrico" />
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />

    </main>
  )
}
