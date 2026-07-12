import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'

export const metadata: Metadata = {
  title: 'Tar and Chip Paving Contractors Virginia | Chip Seal Driveways',
  description: 'Top-rated tar and chip paving contractors in Virginia. We build heavy-duty chip seal rural driveways and farm roads from Roanoke to Charlottesville.',
  keywords: 'Tar and Chip paving, Chip Seal Driveway, Rural Driveway Paving, Farm Road Paving, Virginia Tar and Chip, Macadam Paving',
}

export default function TarAndChipPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('/images/driveway.png')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Tar & <span>Chip Paving</span></h1>
          <p>The Ultimate Heavy-Duty, Cost-Effective Solution for Massive Rural Driveways and Agricultural Roads.</p>
        </div>
      </section>

      {/* SEO Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> Tar and Chip paving (also known as Chip Seal or Macadam) is a highly durable, cost-effective alternative to traditional hot mix asphalt, specifically engineered for long rural driveways, farm roads, and expansive agricultural properties across the Virginia Highlands. By combining hot liquid asphalt cement with washed angular aggregate, Blue Ridge Estate Paving delivers a rustic, textured surface that provides superior traction on steep mountain grades while costing significantly less per square foot than traditional blacktop. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>What is Tar and Chip Paving?</h2>
          <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            If you own an estate in the Virginia Highlands, you know the struggle of maintaining a gravel road on a steep incline. Heavy spring rains wash the gravel away, and winter freeze-thaws turn the road into a muddy, impassable rut. For long agricultural lanes, deep mountain switchbacks, and massive rural driveways, traditional asphalt is often cost-prohibitive. <strong style={{ color: 'var(--pure-white)' }}>Tar and Chip (Macadam) is the permanent, heavy-duty solution.</strong>
          </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8' }}>
          At Blue Ridge Estate Paving, we start by heavily compacting a #21A crushed stone subbase. We then spray a heavy coating of liquid asphalt cement (the "tar") over the compacted base using a computerized distributor truck. Immediately after, a calibrated stone spreader drops washed, angular aggregate (the "chip") into the hot liquid. Finally, massive vibratory rollers press the stone deep into the asphalt binder, locking it in place.
        </p>

        <h2 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Top 4 Benefits of Chip Seal Driveways</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Massive Cost Savings</h3>
            <p style={{ color: '#555' }}>For driveways exceeding 500 feet in length, traditional hot mix asphalt becomes prohibitively expensive. Tar and Chip provides a hard-bound, dust-free surface at a fraction of the cost, making it the only logical choice for massive rural estates and farm roads.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Superior Mountain Traction</h3>
            <p style={{ color: '#555' }}>Traditional asphalt is smooth, which can become dangerous on steep Appalachian inclines during snow or rain. The exposed aggregate in a Tar and Chip driveway provides exceptional mechanical grip for tires, completely eliminating slip hazards on steep rural grades.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Zero Maintenance Required</h3>
            <p style={{ color: '#555' }}>Unlike traditional asphalt, which requires sealcoating every 3-4 years to prevent UV oxidation, Tar and Chip driveways are entirely maintenance-free. The exposed stone takes the brunt of the UV radiation, meaning you never have to sealcoat a chip seal driveway. Ever.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Rustic Estate Aesthetics</h3>
            <p style={{ color: '#555' }}>A solid black driveway can look out of place winding through a beautiful wooded estate. Tar and Chip allows you to select the color of the aggregate (such as brown river rock or gray granite), creating a natural, rustic aesthetic that blends perfectly with the Virginia landscape.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Logging & Farm Road Access</h3>
            <p style={{ color: '#555' }}>Deep in the hollers, heavy farm equipment and logging trucks destroy standard pavement. Tar and chip provides an incredibly dense, load-bearing surface that flexes without shattering, making it the premier choice for heavy agricultural and timber access roads.</p>
          </div>
        </div>

      </section>

      {/* Injecting the Visual Proof Gallery */}
      <VisualProofGallery />

    </main>
  )
}
