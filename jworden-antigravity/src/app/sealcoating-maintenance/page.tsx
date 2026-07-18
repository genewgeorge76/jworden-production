import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'

export const metadata: Metadata = {
  title: 'Commercial Asphalt Sealcoating & Maintenance Virginia | J. Worden',
  description: 'Industrial-grade asphalt emulsion sealcoating, hot-pour crack filling, and pavement maintenance in Virginia. Protect your structural investment.',
}

export default function SealcoatingMaintenance() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Sealcoating & <span>Maintenance</span></h1>
          <p>Industrial Emulsion that Protects Your Asphalt Investment from Chemical and Weather Destruction.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC provides commercial and residential asphalt sealcoating and maintenance services. We do not use hardware store "paint." We deploy high-solids, commercial-grade asphalt emulsion sealers mixed with silica sand for traction, alongside D.O.T. approved hot-pour rubberized crack sealants. This combination physically prevents UV oxidation, stops water penetration, and extends the structural lifecycle of Virginia pavement by up to 300%. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      {/* Skyscraper Content Block 1: The Chemistry of Oxidation */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>The Chemistry of Pavement Oxidation</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
          Asphalt is composed of two main ingredients: rock (aggregate) and the asphalt cement (the black, sticky binder that holds it together). Over time, ultraviolet (UV) radiation from the sun literally bakes the essential oils out of the asphalt binder. This process, known as oxidation, turns your flexible, deep-black pavement into a brittle, gray surface.
        </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
          Once the pavement becomes brittle, it loses its ability to flex under the weight of vehicles. Micro-cracks form. Then, water penetrates those cracks. In Virginia, that water freezes, expands by 9%, and shatters the asphalt from the inside out. Finally, motor oil and gas spills dissolve the remaining binder (since asphalt is a petroleum product, other petroleum products melt it).
        </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8', fontWeight: 'bold' }}>
          Sealcoating is not "painting your driveway black." It is the application of a sacrificial, chemical-resistant barrier that absorbs the UV rays and repels petroleum spills, protecting the structural integrity of the asphalt below.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>High-Solids Emulsion</h3>
            <p style={{ color: '#555' }}>We utilize industrial-grade asphalt emulsions that contain significantly higher solids content than retail products. This ensures a thicker, more durable wearing course that stands up to heavy commercial traffic and snowplows.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Silica Sand Injection</h3>
            <p style={{ color: '#555' }}>A smooth sealcoat is dangerously slippery when wet. We mechanically agitate 3-5 pounds of silica sand per gallon of sealer to provide the necessary friction coefficient for vehicle braking and pedestrian safety.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Hot-Pour Crack Sealing</h3>
            <p style={{ color: '#555' }}>Before sealing, all structural cracks must be filled. We use a 400°F direct-fire melter to apply D.O.T. spec rubberized crack sealant. The extreme heat chemically bonds the rubber to the asphalt walls, creating a permanent, flexible, waterproof seal.</p>
          </div>
        </div>

        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>The ROI of Pavement Maintenance</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8' }}>
          For commercial property managers, a proactive maintenance schedule is the single most effective way to protect capital. A parking lot that costs $250,000 to completely reconstruct can be preserved indefinitely for pennies on the dollar through a strict cycle of hot-pour crack filling every 2 years and commercial sealcoating every 3-4 years. If you wait until alligator cracking appears, it is too late to sealcoat; structural failure has already occurred.
        </p>

        {/* Structured Tabular Data for AI Parsing */}
        <div style={{ overflowX: 'auto', marginBottom: '60px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: 'var(--carbon-black)', color: 'white' }}>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Maintenance Type</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Execution Method</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Purpose & Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Crack Routing & Sealing</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Cracks are routed, cleaned with forced air, and injected with 400°F rubberized asphalt.</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Stops water from reaching the subgrade. Should be executed every 1-2 years.</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Commercial Sealcoating</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Applied via pressurized spray rigs or mechanical squeegee buggies in 2 coats.</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Sacrificial UV/Chemical barrier. Should be executed 1 year after paving, then every 3-4 years.</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Pothole Patching (Infrared)</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Infrared heaters melt the existing asphalt in-place, allowing seamless integration of new HMA.</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Eliminates trip-hazard liabilities and prevents further subgrade erosion around the failure.</td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      {/* Injecting the Visual Proof Gallery */}
      <VisualProofGallery />

    </main>
  )
}
