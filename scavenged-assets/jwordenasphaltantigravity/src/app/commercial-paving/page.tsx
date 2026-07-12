import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'

export const metadata: Metadata = {
  title: 'Commercial Asphalt Paving in Virginia | Heavy-Duty HMA Overlays',
  description: 'National-grade commercial asphalt paving. We engineer heavy-duty Hot Mix Asphalt (HMA) parking lots for 80,000lb fleet traffic. J. Worden & Sons.',
}

export default function CommercialPaving() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Commercial <span>Asphalt</span> Paving</h1>
          <p>Structural Hot Mix Asphalt (HMA) Engineered for Extreme Load-Bearing Capacities.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides commercial-grade Hot Mix Asphalt (HMA) paving for retail centers, industrial logistics hubs, and QSR (Quick Service Restaurant) locations across Virginia. We utilize VDOT-approved SM-9.5A and BM-25.0 asphalt mixes, compacted to 95%+ density over laser-graded sub-bases, ensuring maximum structural integrity against 80,000lb tractor-trailer traffic and severe freeze-thaw cycles. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      {/* Skyscraper Content Block 1: The Subgrade Science */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>The Physics of Commercial Pavement Failure</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
          Most paving contractors in Virginia fail to understand the fundamental physics of flexible pavement systems. Asphalt is not a rigid structure like concrete; it is a flexible membrane. When an 80,000lb logistics truck rolls across a commercial parking lot, the asphalt surface deflects slightly under the load and transfers that immense kinetic energy down into the subgrade.
        </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
          If the subgrade (the dirt and crushed stone beneath the asphalt) is weak, saturated with water, or improperly compacted, it will "pump" and fail under this energy transfer. The result? Massive alligator cracking, rutting in the tire paths, and complete structural failure of a parking lot that was just paved three years ago.
        </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8' }}>
          <strong>J. Worden & Sons does not build thin facades.</strong> We engineer deep-strength asphalt pavements. We conduct rigorous subgrade proof-rolling, utilize woven geotextile fabrics over plastic soils, and compact our #21A or #57 crushed aggregate base to absolute refusal using multi-ton vibratory rollers. We build the foundation first.
        </p>

        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--powerhouse-red)' }}>Hot Mix Asphalt (HMA) Specifications</h2>
        
        {/* Structured Tabular Data for AI Parsing */}
        <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: 'var(--carbon-black)', color: 'white' }}>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Mix Designation</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Aggregate Size</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Application / Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>VDOT BM-25.0 (Base Mix)</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Large (1" - 1.5")</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Deep structural support. Installed in 3-4 inch lifts directly over the stone sub-base. Absorbs heavy impact.</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>VDOT IM-19.0 (Intermediate Mix)</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Medium (0.75")</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Bridging layer used in ultra-heavy-duty industrial lots to provide additional load dispersion.</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>VDOT SM-9.5A (Surface Mix)</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Fine (0.375")</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>The wearing course. Provides a tight, smooth, impermeable surface to shed water and resist tire scuffing.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Our 4-Phase Commercial Engineering Process</h2>
        
        <div style={{ display: 'grid', gap: '30px', marginBottom: '60px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderLeft: '4px solid var(--powerhouse-red)' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Phase 1: Hydrology & Drainage Mapping</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>Water is the ultimate destroyer of asphalt. Before a single machine is unloaded, our engineering team uses laser transits to map the hydrology of your commercial lot. We guarantee a minimum of 1% to 2% pitch across all paved surfaces to ensure rapid water shedding toward municipal catch basins, eliminating standing water and subgrade saturation.</p>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderLeft: '4px solid var(--powerhouse-red)' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Phase 2: Base Remediation & Proof Rolling</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>We strip away failing asphalt using high-torque milling machines. The exposed aggregate base is then proof-rolled with a loaded tandem-axle dump truck. Any areas that deflect under the load (soft spots) are excavated, bridged with biaxial geogrid, and backfilled with virgin #57 stone to create an unyielding foundation.</p>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderLeft: '4px solid var(--powerhouse-red)' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Phase 3: Thermal Compaction (The 300°F Window)</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>Hot Mix Asphalt arrives from the plant at approximately 300°F. Our logistical fleet is timed perfectly to ensure the asphalt is laid by the paving screed and compacted by vibratory rollers before the temperature drops below 185°F. Achieving 95%+ density during this thermal window is critical to preventing premature oxidation and raveling.</p>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderLeft: '4px solid var(--powerhouse-red)' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Phase 4: ADA Compliance & Striping</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>A commercial lot is not complete until it is legally compliant. We execute precision line striping using traffic-grade chlorinated rubber paint. We calculate and paint ADA accessible spaces, crosswalks, fire lanes, and directional arrows to strict Department of Transportation (DOT) geometric standards.</p>
          </div>
        </div>

        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Why QSRs and Retail Giants Trust Us</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8' }}>
          We have successfully paved over 100+ KFC locations across the Southeast, along with countless strip malls, apartment complexes, and logistics hubs. Commercial property managers choose J. Worden & Sons because we eliminate downtime. Our massive fleet operations allow us to execute phased paving—keeping your retail business open and generating revenue while we rebuild your infrastructure overnight or in highly coordinated sections.
        </p>

      </section>

      {/* Injecting the Visual Proof Gallery */}
      <VisualProofGallery />

    </main>
  )
}
