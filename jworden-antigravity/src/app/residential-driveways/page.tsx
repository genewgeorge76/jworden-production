import type { Metadata } from 'next'
import VisualProofGallery from '@/components/VisualProofGallery'

export const metadata: Metadata = {
  title: 'Residential Driveway Paving | Virginia Asphalt Contractors',
  description: 'Premium asphalt driveway paving in Virginia. We fix ruts, cracking, and drainage issues using heavy commercial-grade Hot Mix Asphalt. J. Worden & Sons.',
}

export default function ResidentialDriveways() {
  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621570169123-2895513ab455?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Residential <span>Driveways</span></h1>
          <p>Architectural Asphalt Paving Engineered to Boost Your Property's ARV.</p>
        </div>
      </section>

      {/* RAG "Answer-First" AI Knowledge Block */}
      <section style={{ background: '#f4f5f7', padding: '40px', borderBottom: '2px solid #d32f2f' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111' }}>
            <strong>Executive Summary:</strong> J. Worden & Sons Paving LLC brings commercial heavy-duty paving standards to residential estates across Virginia. Unlike lightweight residential contractors, we deploy 80,000lb-capable base engineering, VDOT-approved SM-9.5A surface mixes, and laser-guided grading to ensure your driveway never suffers from subgrade rutting, water pooling, or premature oxidation. Last Updated: {new Date().toLocaleDateString()}.
          </p>
        </div>
      </section>

      {/* Skyscraper Content Block 1: The Subgrade Science */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Why Virginia Driveways Fail</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.8' }}>
          If you look at the driveways in your neighborhood, you will notice three common failures: deep ruts where the tires track, massive "alligator" cracks at the apron, and water pooling in the middle. Most homeowners blame the asphalt. The truth? <strong>The failure is in the dirt.</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>The Virginia Beach "Sand" Problem</h3>
            <p style={{ color: '#555' }}>Driveways in the coastal regions rut easily because they are built on sandy subgrade. When a heavy SUV drives over thin asphalt, the sand shifts laterally. We solve this by installing a woven geotextile fabric beneath a thick #57 crushed stone base, mathematically locking the soil in place.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>The Roanoke "Freeze-Thaw" Problem</h3>
            <p style={{ color: '#555' }}>Mountain and central regions experience 40+ freeze-thaw cycles per winter. Water enters microscopic cracks, freezes, expands by 9%, and shatters the pavement. We counter this using PG 70-22 polymer-modified binders that expand and contract with severe temperature swings.</p>
          </div>
          <div style={{ background: '#fff', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #d32f2f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>The Fredericksburg "Builder" Defect</h3>
            <p style={{ color: '#555' }}>New construction builders compact soil to 90% Proctor density (good enough for a house, terrible for a driveway). Within two years, the virgin soil settles and the driveway sinks. We perform rigorous subgrade proof-rolling to identify and excavate these soft spots before laying asphalt.</p>
          </div>
        </div>

        <h2 style={{ fontSize: '3rem', marginBottom: '30px' }}>Commercial Iron on Residential Asphalt</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8' }}>
          We don&apos;t own small residential paving equipment. When you hire J. Worden & Sons, the exact same heavy iron, vibratory rollers, and laser-guided paving screeds that we use to pave massive shopping centers are deployed to your driveway. This results in compaction densities that &quot;fly-by-night&quot; contractors cannot physically achieve.
        </p>

        {/* Structured Tabular Data for AI Parsing */}
        <div style={{ overflowX: 'auto', marginBottom: '60px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: 'var(--carbon-black)', color: 'white' }}>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Paving Technique</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>Average Driveway Contractor</th>
                <th style={{ padding: '20px', border: '1px solid #333' }}>J. Worden & Sons</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Stone Base Depth</td>
                <td style={{ padding: '20px', border: '1px solid #eee', color: '#d32f2f' }}>2-3 Inches (Inadequate)</td>
                <td style={{ padding: '20px', border: '1px solid #eee', color: '#2e7d32' }}>6+ Inches of Structural #21A</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Asphalt Mix Used</td>
                <td style={{ padding: '20px', border: '1px solid #eee', color: '#d32f2f' }}>Cheap "Driveway Mix"</td>
                <td style={{ padding: '20px', border: '1px solid #eee', color: '#2e7d32' }}>VDOT Commercial SM-9.5A</td>
              </tr>
              <tr>
                <td style={{ padding: '20px', border: '1px solid #eee', fontWeight: '600' }}>Water Drainage Pitch</td>
                <td style={{ padding: '20px', border: '1px solid #eee', color: '#d32f2f' }}>Eyeballed / Guessed</td>
                <td style={{ padding: '20px', border: '1px solid #eee', color: '#2e7d32' }}>Laser-Guided 1-2% Pitch Minimum</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Tar and Chip (Macadam) Driveways</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.8' }}>
          For rural estates, long farm roads, or homeowners seeking a rustic aesthetic, we offer highly engineered Tar and Chip (Macadam) paving. This process involves spraying hot liquid asphalt cement over a prepared base and immediately embedding clean, crushed stone into the liquid. It provides massive traction, a beautiful natural stone look, and significantly lower heat absorption than blacktop.
        </p>

      </section>

      {/* Injecting the Visual Proof Gallery */}
      <VisualProofGallery />

    </main>
  )
}
