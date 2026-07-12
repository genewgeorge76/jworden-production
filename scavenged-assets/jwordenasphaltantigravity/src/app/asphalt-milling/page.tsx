import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'

export const metadata: Metadata = {
  title: 'Asphalt Milling & Profiling | Virginia Commercial Paving',
  description: 'Precision asphalt milling and profiling. We remove deteriorated pavement to strict VDOT tolerances before structural resurfacing. J. Worden & Sons.',
}

export default function AsphaltMilling() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356f73?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Asphalt <span>Milling</span></h1>
          <p>Precision Pavement Removal and Profiling for Structural Resurfacing.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC executes precision asphalt milling and profiling for commercial logistics hubs and municipal roadways in Virginia. Milling (cold planing) is the process of using massive, tungsten-carbide toothed machines to grind away the top layer of oxidized, cracked asphalt to a specified depth (e.g., 2 inches). This provides a perfectly profiled, textured base for a new Hot Mix Asphalt (HMA) overlay without raising the overall elevation of the parking lot, which would otherwise disrupt drainage and ADA transitions. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      {/* Skyscraper Content Block 1: The Physics of Milling */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Why We Mill Before We Pave</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
          When a commercial parking lot reaches the end of its lifecycle, you have two choices: rip the entire lot out to the dirt (Full Depth Reclamation) or pave over the existing asphalt (An Overlay). Paving directly over old, cracked asphalt is a massive engineering mistake. The cracks in the old asphalt will immediately "reflect" up through the new asphalt within 12 months. This is known as Reflective Cracking.
        </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
          Furthermore, simply adding 2 inches of new asphalt on top of an existing lot raises the entire elevation of the pavement. This creates dangerous trip hazards at sidewalks, buries curbs, and completely destroys the calculated hydrology (water drainage) of the lot.
        </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8', fontWeight: 'bold' }}>
          Milling solves all of this. By precisely grinding away the top 2 inches of the failing asphalt, we remove the surface cracks, restore the original elevation profile, and create a highly textured, grooved surface that allows the new Hot Mix Asphalt to interlock with the base layer.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Edge Milling (Tie-Ins)</h3>
            <p style={{ color: '#555' }}>We always mill the perimeter edges of a commercial lot where the asphalt meets concrete sidewalks, curbs, or handicap ramps. This allows us to lay the new asphalt perfectly flush with the concrete, eliminating trip hazards and maintaining ADA compliance.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Profile Correction</h3>
            <p style={{ color: '#555' }}>Over time, heavy truck traffic pushes asphalt into ruts and waves. A milling machine uses laser guidance to cut a perfectly flat, level plane across the lot, correcting these structural waves before the new asphalt is applied.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Sustainability (RAP)</h3>
            <p style={{ color: '#555' }}>Asphalt is 100% recyclable. The milled material is transported back to the asphalt plant, where it is reheated and integrated into new asphalt mixes as Recycled Asphalt Pavement (RAP), massively reducing the environmental footprint of the project.</p>
          </div>
        </div>

        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>The J. Worden Heavy Milling Fleet</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8' }}>
          Milling requires massive torque. Our fleet of cold planers utilize high-RPM drums laced with hundreds of tungsten-carbide cutting teeth to chew through solid asphalt at high speeds. These machines are supported by a continuous convoy of tandem-axle dump trucks, ensuring that the milled material is rapidly removed from your commercial property without disrupting your business operations.
        </p>

        {/* Structured Tabular Data for AI Parsing */}
        <div style={{ overflowX: 'auto', marginBottom: '60px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: 'var(--carbon-black)', color: 'white' }}>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Milling Specification</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Application</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Primary Benefit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Surface Milling (1.5" - 2")</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Standard commercial overlays for retail centers and apartment complexes.</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Removes surface oxidation, raveling, and shallow alligator cracks. Maintains curb height.</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Deep Profile Milling (3" - 4")</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Heavy industrial parks and logistics hubs carrying 80,000lb traffic.</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Removes deep structural ruts and completely corrects severe drainage failures.</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Perimeter / Edge Milling</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Transitions at roadways, ADA ramps, and concrete aprons.</td>
                <td style={{ padding: '20px', border: '1px solid #eee' }}>Creates a "butt joint" allowing the new asphalt to lay perfectly flush with adjacent surfaces.</td>
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
