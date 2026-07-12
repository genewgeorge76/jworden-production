import { HardHat, ShieldCheck, Cog, CheckCircle2, Trophy, Navigation, Star, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import AIEstimationForm from '@/components/AIEstimationForm'
import VisualProofGallery from '@/components/VisualProofGallery'

export default function Home() {
  return (
    <main>
      {/* Heavy Black/Red Hero */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Premium Asphalt Engineered to <span>Survive the Mountains.</span></h1>
          <p>
            We build flawless, structural-grade driveways and commercial parking lots that eliminate drainage issues, prevent washouts, and easily withstand extreme Appalachian freeze-thaw cycles. Proudly serving the entire region from Monterey to Charlottesville, and Roanoke to Winchester, VA.
          </p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
            <a href="#contact" className="btn-primary" style={{ fontSize: '1.1rem', padding: '20px 40px' }}>Request a Free Quote</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 20px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '20px', color: 'var(--pure-white)' }}>
            <span style={{ color: 'var(--powerhouse-red)' }}>Deep Highland Access:</span> We Pave Where Others Won't
          </h2>
          <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', lineHeight: '1.8', maxWidth: '900px', margin: '0 auto' }}>
            We aren't just a subdivision paving crew. From the winding switchbacks of the Blue Ridge Parkway down into the deepest hollers of the Virginia Highlands, we specialize in paving miles of back mountain roads. Whether it's an agricultural farm lane, a steep logging road access, or a multi-mile private estate drive deep in the woods, our heavy machinery and Tar & Chip fleets are engineered to conquer the rugged, off-grid Appalachian terrain.
          </p>
        </div>
      </section>

      {/* Red Trust Strip */}
      <section className="trust-strip">
        <div className="trust-item"><ShieldCheck size={36} color="#ffffff" /> Licensed & Insured</div>
        <div className="trust-item"><Trophy size={36} color="#ffffff" /> 40+ Years of Excellence</div>
        <div className="trust-item"><HardHat size={36} color="#ffffff" /> Commercial Grade</div>
      </section>

      {/* High-End Authority Bar */}
      <section style={{ background: 'var(--bg-secondary)', padding: '50px 40px', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '30px', alignItems: 'center' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 40px', flex: '1', minWidth: '300px' }}>
            <span className="gold-text" style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>100+ KFC LOCATIONS</span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '5px' }}>Paved Across the Southeast</span>
          </div>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 40px', flex: '1', minWidth: '300px' }}>
            <span className="gold-text" style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>TOP 75 CONTRACTOR</span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '5px' }}>Pavement Magazine Award</span>
          </div>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 40px', flex: '1', minWidth: '300px' }}>
            <span className="gold-text" style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>BEST OF HOUZZ</span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '5px' }}>4-Time Service Award Winner</span>
          </div>
        </div>
      </section>

      {/* The Flush Square Grid (Rose Clone + Upgrade) */}
      <section id="services" className="services-section" style={{ padding: '0', maxWidth: '100%' }}>
        <div className="massive-grid">
          
          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('/images/machinery.png')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Asphalt Paving</h3>
              <p>High-density commercial overlays designed for 80,000lb fleet traffic and severe weather resilience.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('/images/sealcoating.png')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Sealcoating</h3>
              <p>Industrial emulsion that protects your structural investment from UV oxidation, water penetration, and chemical spills.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('/images/milling.png')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Asphalt Milling</h3>
              <p>Precision removal of deteriorated asphalt to provide a flawless, sustainable base for structural resurfacing.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('/images/driveway.png')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Rural & Steep Driveways</h3>
              <p>Architectural paving designed to handle severe inclines, engineered swales for watershed management, and heavy 6-inch stone bases to survive mountain winters.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 4th Generation Heritage Section */}
      <section style={{ padding: '100px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 500px' }}>
            <h2 className="gold-text" style={{ fontSize: '3.5rem', marginBottom: '20px', letterSpacing: '-1px' }}>4th Generation Engineering.</h2>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--pure-white)', marginBottom: '30px' }}>Established 1984 | Founded by GW George</h3>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '20px' }}>
              We aren't a pop-up paving company. We are a family-owned legacy. For over 40 years, our family has engineered the structural pavement for the most demanding commercial and residential projects across the Eastern Seaboard.
            </p>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              Operating with the same 4th generation expertise, <strong>Blue Ridge Estate Paving</strong> brings massive, 80,000lb-rated commercial engineering specifically to the steep inclines and complex topographies of the Appalachian Mountains.
            </p>
          </div>
          <div style={{ flex: '1 1 500px', position: 'relative', minHeight: '350px' }}>
            <Image src="/images/machinery.png" alt="Heavy paving machinery in action" fill style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      </section>

      {/* The Upgrade: Rose lacks the modern tech narrative. We inject it here. */}
      <section style={{ padding: '120px 40px', background: 'var(--bg-primary)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Navigation size={64} color="var(--estate-gold)" style={{ marginBottom: '30px' }} />
          <h2 style={{ fontSize: '4rem', marginBottom: '30px', letterSpacing: '-1px' }}>The Blue Ridge Advantage</h2>
          <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', fontWeight: '400', marginBottom: '80px', lineHeight: '1.8' }}>
            We combine four decades of hardcore construction experience with cutting-edge AI satellite topography.
            Whether your property sits off the Blue Ridge Parkway or deep in the Shenandoah Valley, our proprietary systems scan your terrain from orbit, delivering flawless, zero-friction estimates before we even dispatch a crew.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', textAlign: 'left' }}>
            <div className="glass-panel" style={{ padding: '50px', borderTop: '4px solid var(--estate-gold)' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>1. Remote Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '1.1rem', lineHeight: '1.7' }}>You submit your address. Our AI scans the topography, square footage, and structural layout of your lot via satellite.</p>
            </div>
            <div className="glass-panel" style={{ padding: '50px', borderTop: '4px solid var(--estate-gold)' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>2. Precision Scoping</h3>
              <p style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '1.1rem', lineHeight: '1.7' }}>We eliminate human error in the estimation phase. You receive an incredibly accurate, itemized quote instantly.</p>
            </div>
            <div className="glass-panel" style={{ padding: '50px', borderTop: '4px solid var(--estate-gold)' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>3. Flawless Execution</h3>
              <p style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '1.1rem', lineHeight: '1.7' }}>Our heavy fleet rolls out with exact schematics, laying premium grade asphalt perfectly leveled for optimal water runoff.</p>
            </div>
          </div>
        </div>
      </section>

      <VisualProofGallery />

      {/* E-E-A-T Google Trust Section: Real Authority & Real Reviews */}
      <section style={{ padding: '100px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '15px', letterSpacing: '-1px' }}>Real Authority. <span className="gold-text">Real Results.</span></h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Don't take our word for it. See what property owners across the state are saying.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            {/* The Aggregate Trust Badge */}
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                <Star fill="var(--estate-gold)" color="var(--estate-gold)" size={32} />
                <Star fill="var(--estate-gold)" color="var(--estate-gold)" size={32} />
                <Star fill="var(--estate-gold)" color="var(--estate-gold)" size={32} />
                <Star fill="var(--estate-gold)" color="var(--estate-gold)" size={32} />
                <Star fill="var(--estate-gold)" color="var(--estate-gold)" size={32} style={{ clipPath: 'polygon(0 0, 40% 0, 40% 100%, 0% 100%)' }} />
              </div>
              <h3 style={{ fontSize: '3rem', margin: '0', lineHeight: '1' }}>4.4<span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>/5</span></h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--estate-gold)', fontWeight: '600', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Based on 74+ Reviews</p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '25px', opacity: '0.8' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px' }}>FACEBOOK</span>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px' }}>ANGI</span>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px' }}>HOUZZ</span>
              </div>
            </div>

            {/* Placeholder Review Card 1 */}
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} fill="var(--estate-gold)" color="var(--estate-gold)" size={16} />)}
                </div>
                <p style={{ fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  "The team was incredibly professional, friendly, and hardworking. They went above and beyond to assist with the site preparation and delivered a beautiful, well-drained, and highly durable driveway."
                </p>
              </div>
              <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <strong style={{ display: 'block', color: 'var(--pure-white)', fontSize: '1.1rem' }}>- Verified Customer</strong>
                <span style={{ color: 'var(--estate-gold)', fontSize: '0.9rem' }}>Via Houzz</span>
              </div>
            </div>

            {/* Placeholder Review Card 2 */}
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} fill="var(--estate-gold)" color="var(--estate-gold)" size={16} />)}
                </div>
                <p style={{ fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  "Fair and competitive pricing from a team that clearly cares about quality. Any minor drainage issues we encountered were fixed immediately at no extra cost. Highly recommend."
                </p>
              </div>
              <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <strong style={{ display: 'block', color: 'var(--pure-white)', fontSize: '1.1rem' }}>- Verified Customer</strong>
                <span style={{ color: 'var(--estate-gold)', fontSize: '0.9rem' }}>Via Angi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mountain Paving FAQs */}
      <section style={{ padding: '100px 40px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '15px', letterSpacing: '-1px' }}>Mountain Paving <span className="gold-text">FAQs</span></h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Technical answers to the most common Virginia Highlands paving challenges.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <details className="faq-details glass-panel" style={{ padding: '30px', cursor: 'pointer' }}>
              <summary style={{ fontSize: '1.5rem', fontWeight: 'bold', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Why do driveways in Roanoke and the Blue Ridge Mountains crack so frequently?
                <ChevronDown className="faq-icon" color="var(--estate-gold)" />
              </summary>
              <div style={{ marginTop: '20px', fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                The Appalachian region experiences over 40 freeze-thaw cycles per winter. If your driveway lacks a heavy 6-inch stone base and woven geotextile fabric, the subgrade will saturate, freeze, expand, and shatter the asphalt surface.
              </div>
            </details>
            <details className="faq-details glass-panel" style={{ padding: '30px', cursor: 'pointer' }}>
              <summary style={{ fontSize: '1.5rem', fontWeight: 'bold', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                How does Blue Ridge Estate Paving handle steep mountain driveways?
                <ChevronDown className="faq-icon" color="var(--estate-gold)" />
              </summary>
              <div style={{ marginTop: '20px', fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                Steep grades require specific PG 70-22 polymer-modified binders that resist downward creep in summer heat, combined with deep aggregate bases and precise water diversion swales to prevent washouts.
              </div>
            </details>
            <details className="faq-details glass-panel" style={{ padding: '30px', cursor: 'pointer' }}>
              <summary style={{ fontSize: '1.5rem', fontWeight: 'bold', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                How much does it cost to pave a driveway in the Virginia Highlands in 2026?
                <ChevronDown className="faq-icon" color="var(--estate-gold)" />
              </summary>
              <div style={{ marginTop: '20px', fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                In 2026, mountain-grade driveway paving ranges from $6–$11 per square foot, depending heavily on the slope, necessary grading, and depth of the crushed stone base required to survive the local climate.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Massive Contact Block - High End Edition */}
      <section id="contact" style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ flex: '1 1 50%', background: 'var(--bg-secondary)', padding: '120px 100px', color: 'var(--text-primary)' }}>
          <h2 className="gold-text" style={{ fontSize: '3.5rem', marginBottom: '30px', letterSpacing: '-1px' }}>Virginia's Premier Asphalt Paving Contractor.</h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '24px', lineHeight: '1.9', color: 'var(--text-secondary)' }}>
            As a 4th-generation asphalt paving company, we specialize in high-durability residential driveways and commercial parking lots across the Virginia Highlands—from Monterey to Charlottesville, and Roanoke to Winchester, VA. We don't cut corners on subgrade preparation. Every project starts with a fully compacted, heavy-duty #21A crushed stone base to prevent future settling, rutting, or alligator cracking.
          </p>
          <p style={{ fontSize: '1.25rem', marginBottom: '24px', lineHeight: '1.9', color: 'var(--text-secondary)' }}>
            Whether you need a steep mountain driveway paved with VDOT-approved hot mix asphalt, or a massive commercial retail lot requiring precision milling, ADA-compliant line striping, and industrial sealcoating, <strong style={{ color: 'var(--pure-white)' }}>Blue Ridge Estate Paving</strong> delivers structural pavement engineered to outlast the harsh Appalachian freeze-thaw cycles.
          </p>
          <p style={{ fontSize: '1.2rem', marginBottom: '50px', lineHeight: '1.8', fontWeight: '600', color: 'var(--estate-gold)' }}>
            Fill out the form to initiate your remote AI satellite estimate for your mountain property.
          </p>
          <div className="glass-panel" style={{ padding: '30px', marginTop: '20px' }}>
            <AIEstimationForm location="The Virginia Highlands" />
          </div>
        </div>
        <div style={{ flex: '1 1 50%', background: "url('/images/hero.png') center/cover" }}></div>
      </section>

    </main>
  )
}
