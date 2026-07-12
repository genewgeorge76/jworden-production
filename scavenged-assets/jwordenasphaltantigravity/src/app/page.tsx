import { HardHat, ShieldCheck, Cog, CheckCircle2, Trophy, Navigation } from 'lucide-react'
import AIEstimationForm from '@/components/AIEstimationForm'

export default function Home() {
  return (
    <main>
      {/* Heavy Black/Red Hero */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Paving the <span>Way</span> Forward.</h1>
          <p>
            We are the premier commercial asphalt and parking lot maintenance company in Virginia. Unmatched scale, precision AI estimates, and over 40 years of operational dominance.
          </p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
            <a href="#contact" className="btn-primary" style={{ fontSize: '1.1rem', padding: '20px 40px' }}>Request a Free Quote</a>
          </div>
        </div>
      </section>

      {/* Red Trust Strip */}
      <section className="trust-strip">
        <div className="trust-item"><ShieldCheck size={36} color="#ffffff" /> Licensed & Insured</div>
        <div className="trust-item"><Trophy size={36} color="#ffffff" /> 40+ Years of Excellence</div>
        <div className="trust-item"><HardHat size={36} color="#ffffff" /> Commercial Grade</div>
      </section>

      {/* Legacy Authority Bar (From jwordenasphaltpaving.com) */}
      <section style={{ background: '#f4f5f7', padding: '30px 40px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--powerhouse-red)', fontFamily: 'Bebas Neue, sans-serif' }}>100+ KFC LOCATIONS</span>
            <span style={{ fontSize: '1rem', color: '#555', fontWeight: '600', textTransform: 'uppercase' }}>Paved Across the Southeast</span>
          </div>
          <div style={{ width: '2px', height: '50px', background: '#ccc' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--powerhouse-red)', fontFamily: 'Bebas Neue, sans-serif' }}>TOP 75 CONTRACTOR</span>
            <span style={{ fontSize: '1rem', color: '#555', fontWeight: '600', textTransform: 'uppercase' }}>Pavement Magazine Award</span>
          </div>
          <div style={{ width: '2px', height: '50px', background: '#ccc' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--powerhouse-red)', fontFamily: 'Bebas Neue, sans-serif' }}>BEST OF HOUZZ</span>
            <span style={{ fontSize: '1rem', color: '#555', fontWeight: '600', textTransform: 'uppercase' }}>4-Time Service Award Winner</span>
          </div>
        </div>
      </section>

      {/* The Flush Square Grid (Rose Clone + Upgrade) */}
      <section id="services" className="services-section" style={{ padding: '0', maxWidth: '100%' }}>
        <div className="massive-grid">
          
          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Asphalt Paving</h3>
              <p>High-density commercial overlays designed for 80,000lb fleet traffic and severe weather resilience.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Sealcoating</h3>
              <p>Industrial emulsion that protects your structural investment from UV oxidation, water penetration, and chemical spills.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356f73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Asphalt Milling</h3>
              <p>Precision removal of deteriorated asphalt to provide a flawless, sustainable base for structural resurfacing.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621570169123-2895513ab455?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Residential Driveways</h3>
              <p>Architectural paving designed to massively boost your property's After Repair Value (ARV) with flawless grading.</p>
            </div>
          </div>

        </div>
      </section>

      {/* The Upgrade: Rose lacks the modern tech narrative. We inject it here. */}
      <section style={{ padding: '120px 40px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Navigation size={64} color="#d32f2f" style={{ marginBottom: '30px' }} />
          <h2 style={{ fontSize: '3.5rem', marginBottom: '30px' }}>The J. Worden Advantage</h2>
          <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '60px' }}>
            We combine four decades of hardcore construction experience with cutting-edge AI satellite topography.
            Our proprietary systems scan your property from orbit, delivering flawless, zero-friction estimates before we even arrive.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', textAlign: 'left' }}>
            <div style={{ background: '#fff', padding: '40px', borderTop: '4px solid #d32f2f', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>1. Remote Analysis</h3>
              <p style={{ color: '#555', fontWeight: '500' }}>You submit your address. Our AI scans the topography, square footage, and structural layout of your lot via satellite.</p>
            </div>
            <div style={{ background: '#fff', padding: '40px', borderTop: '4px solid #d32f2f', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>2. Precision Scoping</h3>
              <p style={{ color: '#555', fontWeight: '500' }}>We eliminate human error in the estimation phase. You receive an incredibly accurate, itemized quote instantly.</p>
            </div>
            <div style={{ background: '#fff', padding: '40px', borderTop: '4px solid #d32f2f', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>3. Flawless Execution</h3>
              <p style={{ color: '#555', fontWeight: '500' }}>Our heavy fleet rolls out with exact schematics, laying premium grade asphalt perfectly leveled for optimal water runoff.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Contact Block - Injected with Competitor Weakness Copy */}
      <section id="contact" style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 50%', background: 'var(--powerhouse-red)', padding: '100px 80px', color: 'white' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '30px', color: 'white' }}>The Richmond "Old Guard" is Obsolete.</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px', lineHeight: '1.8' }}>
            For decades, facility managers in Richmond and Chester have suffered through legacy paving contractors who drive out with manual measuring wheels, guess the required Hot Mix Asphalt tonnage, and hand-write estimates. That era is over.
          </p>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px', lineHeight: '1.8' }}>
            <strong>J. Worden & Sons</strong> utilizes advanced orbital satellite topography and AI scanning to calculate your exact square footage, grade variations, and drainage slopes to the inch. We deploy our heavy commercial fleet with mathematical precision, ensuring zero wasted material and perfect ADA compliance. 
          </p>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', lineHeight: '1.8', fontWeight: 'bold' }}>
            Fill out the form to initiate your remote AI satellite estimate.
          </p>
          <div style={{ marginTop: '20px' }}>
            <AIEstimationForm location="Central Virginia" />
          </div>
        </div>
        <div style={{ flex: '1 1 50%', background: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80') center/cover" }}></div>
      </section>

    </main>
  )
}
