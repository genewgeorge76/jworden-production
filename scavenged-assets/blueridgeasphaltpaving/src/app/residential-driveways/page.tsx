import type { Metadata } from 'next'
import Image from 'next/image'
import AIEstimationForm from '@/components/AIEstimationForm'
import VisualProofGallery from '@/components/VisualProofGallery'
import { ShieldCheck, HardHat, Compass } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Steep Mountain Driveway Paving | Blue Ridge Estate Paving',
  description: 'We specialize in heavy-duty asphalt paving and Tar & Chip solutions for steep Appalachian residential driveways. 80,000lb-rated commercial engineering for your private estate.',
}

export default function ResidentialDrivewaysPage() {
  return (
    <main>
      {/* Ultra-Premium Hero */}
      <section className="hero" style={{ position: 'relative', height: '80vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <Image 
          src="/images/driveway.png" 
          alt="Steep mountain driveway paving" 
          fill 
          style={{ objectFit: 'cover', objectPosition: 'center' }} 
          priority
        />
        <div className="hero-overlay" style={{ background: 'rgba(0,0,0,0.15)' }}></div>
        <div className="hero-content" style={{ position: 'relative', zIndex: 10, padding: '0 5%', maxWidth: '1000px' }}>
          <div style={{ display: 'inline-block', border: '1px solid var(--estate-gold)', padding: '8px 20px', color: 'var(--estate-gold)', fontSize: '0.9rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '25px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            High-Altitude Residential Engineering
          </div>
          <h1 style={{ fontSize: '5rem', marginBottom: '25px', lineHeight: '1.1', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
            Conquer the <br/><span style={{ color: 'var(--powerhouse-red)' }}>Appalachian Incline.</span>
          </h1>
          <p style={{ fontSize: '1.5rem', color: '#eaeaea', textShadow: '0 2px 10px rgba(0,0,0,0.8)', maxWidth: '800px', lineHeight: '1.6' }}>
            A steep mountain driveway is not a standard paving job. It requires precision water diversion, extreme mechanical traction, and a deep structural base. We bring commercial-grade engineering to your private estate.
          </p>
        </div>
      </section>

      {/* The 3 Pillars of Mountain Paving */}
      <section style={{ padding: '120px 5%', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '900px', margin: '0 auto 80px auto' }}>
          <h2 className="gold-text" style={{ fontSize: '3rem', marginBottom: '20px' }}>Why Standard Driveways Fail in the Highlands</h2>
          <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
            "Cut-rate" contractors pave mountain driveways the same way they pave flat suburban subdivisions. Within one winter, the asphalt shatters, water washes out the base, and vehicles lose traction. Here is how we prevent failure:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '50px', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <Compass size={48} color="var(--powerhouse-red)" style={{ marginBottom: '25px' }} />
            <h3 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>1. Water Diversion Swales</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              Gravity forces immense volumes of water down a steep incline during spring storms. If water breaches the subgrade, the driveway collapses. We laser-grade precise water diversion swales to channel runoff safely away from the structural base.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '50px', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <HardHat size={48} color="var(--powerhouse-red)" style={{ marginBottom: '25px' }} />
            <h3 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>2. #21A Structural Base</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              We excavate soft clay and install a heavy, compacted layer of VDOT-approved #21A crushed stone. This provides a concrete-like foundation that prevents the asphalt surface from flexing, rutting, or alligator cracking under heavy delivery trucks.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '50px', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <ShieldCheck size={48} color="var(--powerhouse-red)" style={{ marginBottom: '25px' }} />
            <h3 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>3. Maximum Mechanical Traction</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              For grades exceeding 12%, smooth asphalt becomes a dangerous slip hazard in snow and ice. We offer aggressive surface mixes or <strong>Tar & Chip Paving</strong> to provide thousands of exposed stone edges, ensuring absolute vehicle traction year-round.
            </p>
          </div>

        </div>
      </section>

      {/* AI Estimation Integration */}
      <section style={{ padding: '100px 5%', background: 'linear-gradient(to right, #111, #1a1a1a)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '3rem', color: 'var(--pure-white)' }}>Get a Satellite Estate Estimate</h2>
            <p style={{ color: 'var(--estate-gold)', fontSize: '1.3rem', marginTop: '15px' }}>Instantly measure your driveway acreage without waiting for a contractor to drive out.</p>
          </div>
          <AIEstimationForm />
        </div>
      </section>

      {/* Visual Proof */}
      <section style={{ paddingTop: '80px', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 className="gold-text" style={{ fontSize: '2.5rem' }}>Our Highland Estate Portfolio</h2>
        </div>
        <VisualProofGallery />
      </section>

    </main>
  )
}
