import type { Metadata } from 'next'
import AIEstimationForm from '@/components/AIEstimationForm'
import VisualProofGallery from '@/components/VisualProofGallery'
import ServiceAreaSchema from '@/components/ServiceAreaSchema'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { CITIES } from '@/lib/locations'

export async function generateStaticParams() {
  return CITIES.map((city) => ({
    city: city,
  }))
}

// Helper to format the slug into a beautiful city name
function formatCityName(slug: string) {
  if (!slug.includes('-va') && !slug.includes('-wv')) return null;
  const parts = slug.split('-');
  const state = parts.pop()?.toUpperCase(); // VA or WV
  const city = parts.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return { full: `${city}, ${state}`, cityOnly: city, stateOnly: state };
}

// HCU / Geographic Context Engine
function getGeographicContext(city: string) {
  const lowerCity = city.toLowerCase();
  
  if (lowerCity.includes('highlands')) {
    return "The Highlands are our backyard. In fact, our founder has been paving the Highlands of Virginia since he was 15 years old alongside his grandfather. We know exactly how the elevation changes and severe winter weather here destroy standard pavement, which is why we only engineer heavy-duty structural asphalt for this specific region.";
  }
  
  if (['roanoke', 'troutville', 'buchanan', 'fincastle', 'eagle-rock'].some(c => lowerCity.includes(c))) {
    return "The topography of the Roanoke Valley and its surrounding crossroads demands aggressive water diversion. We construct high-grade asphalt swales and deploy deep VDOT #21A stone bases to ensure your pavement survives the rapid freeze-thaw cycles that trap moisture in the valley.";
  }

  if (['charlottesville', 'crozet', 'afton', 'wintergreen'].some(c => lowerCity.includes(c))) {
    return "From the rolling hills of Charlottesville to the steep mountain inclines of Wintergreen, we engineer pavement that resists downward creep during Virginia's brutal summer heat, utilizing specific PG 70-22 polymer-modified binders.";
  }

  if (['monterey', 'franklin', 'mcdowell', 'blue-grass', 'hightown', 'churchville', 'williamsville', 'swoope', 'deerfield', 'mount-solon'].some(c => lowerCity.includes(c))) {
    return "Whether it's paving near the Churchville Post Office, handling the steep grades out in Williamsville, or working across the border in Franklin, WV, operating in rural, high-elevation areas requires a different class of paving. We bring massive, 80,000lb-rated commercial engineering to these isolated mountain crossroads, ensuring your driveway or access road never washes out during severe Appalachian storms.";
  }

  // Shenandoah Valley Default
  return "The Shenandoah Valley and its surrounding foothills require specialized aggregate subgrades. We actively seek out the back mountain roads, farm lanes, and deep highland switchbacks in your area to build permanent, washout-proof roads.";
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const parsedCity = formatCityName(resolvedParams.city);
  if (!parsedCity) return { title: 'Service Area Not Found' };

  return {
    title: `Asphalt Paving in ${parsedCity.full} | Blue Ridge`,
    description: `The leading 4th-generation asphalt paving contractor serving ${parsedCity.full}. We engineer heavy-duty rural driveways, commercial parking lots, and tar and chip surfacing to survive the Appalachian climate.`,
    keywords: `Asphalt Paving ${parsedCity.full}, Driveway Paving ${parsedCity.full}, Commercial Paving ${parsedCity.full}, Tar and Chip ${parsedCity.full}, Sealcoating ${parsedCity.full}, Paving Contractor ${parsedCity.full}`,
  }
}

export default async function CityServicePage({ params }: { params: Promise<{ city: string }> }) {
  const resolvedParams = await params;
  const parsedCity = formatCityName(resolvedParams.city);
  const geoContext = getGeographicContext(resolvedParams.city);

  if (!parsedCity) {
    notFound();
  }
  
  const cityName = parsedCity.full;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.blueridgeasphaltpaving.com"
    },{
      "@type": "ListItem",
      "position": 2,
      "name": "Service Areas",
      "item": "https://www.blueridgeasphaltpaving.com"
    },{
      "@type": "ListItem",
      "position": 3,
      "name": parsedCity.full,
      "item": `https://www.blueridgeasphaltpaving.com/service/${resolvedParams.city}`
    }]
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ServiceAreaSchema city={parsedCity.cityOnly} state={parsedCity.stateOnly} />
      {/* High-End Dynamic Hero */}
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <Image 
          src="/images/hero.png" 
          alt={`Commercial asphalt paving operation in ${parsedCity.full}`}
          fill
          priority
          style={{ objectFit: 'cover', zIndex: 0 }}
        />
        <div className="hero-overlay" style={{ zIndex: 1, position: 'absolute', inset: 0 }}></div>
        <div className="hero-content" style={{ zIndex: 2, position: 'relative' }}>
          <div style={{ display: 'inline-block', border: '1px solid var(--estate-gold)', padding: '5px 15px', color: 'var(--estate-gold)', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
            Exclusive Regional Service Area
          </div>
          <h1 style={{ fontSize: '4.5rem', marginBottom: '20px' }}>Premium Asphalt Paving in <br/><span style={{ color: 'var(--powerhouse-red)' }}>{parsedCity.full}</span>.</h1>
          <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.4rem' }}>
            We bring 80,000lb-rated commercial engineering to {parsedCity.full}. Stop settling for thin asphalt that shatters in the winter. We build structural pavement designed to outlast the mountains.
          </p>
        </div>
      </section>

      {/* Premium Content Split with HCU Geo Context */}
      <section style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--bg-primary)' }}>
        <div style={{ flex: '1 1 50%', padding: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 className="gold-text" style={{ fontSize: '3rem', marginBottom: '30px', letterSpacing: '-1px' }}>Engineering Flawless Pavement for {cityName}.</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.9', marginBottom: '20px' }}>
            Property owners in {cityName} face a unique set of geographic challenges. From steep Appalachian inclines that cause severe water washouts, to brutal winter freeze-thaw cycles that shatter brittle pavement from the inside out. 
          </p>
          <p style={{ fontSize: '1.25rem', color: 'var(--pure-white)', lineHeight: '1.9', marginBottom: '20px', fontWeight: 'bold' }}>
            {geoContext}
          </p>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.9', marginBottom: '20px' }}>
            As a 4th-generation paving company, <strong style={{ color: 'var(--pure-white)' }}>Blue Ridge Estate Paving</strong> does not guess tonnage or skimp on aggregate base. Every driveway and commercial lot we construct in {cityName} begins with a highly compacted, heavy-duty #21A crushed stone subbase. 
          </p>
          
          <div className="glass-panel" style={{ padding: '30px', borderLeft: '4px solid var(--estate-gold)', marginTop: '20px', marginBottom: '50px' }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--estate-gold)', fontStyle: 'italic', margin: 0, lineHeight: '1.8' }}>
              "I have been paving the Highlands and these mountain roads since I was 15 years old working alongside my grandfather. We aren't a pop-up crew—we are a multi-generational Appalachian paving family." <br/>
              <span style={{ display: 'block', marginTop: '10px', fontWeight: 'bold', color: 'var(--pure-white)' }}>— GW George, Founder</span>
            </p>
          </div>

          {/* NEW: SEO Content Silo - Appalachian Terrain & Grading */}
          <div style={{ marginBottom: '50px' }}>
            <h3 style={{ fontSize: '2.2rem', marginBottom: '20px', color: 'var(--estate-gold)' }}>Mountain-Grade Paving & Elevation Engineering</h3>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '15px', lineHeight: '1.8' }}>
              Traditional paving contractors from the flatlands fail to understand the sheer hydrological forces at play in {parsedCity.full}. When paving steep driveways and high-elevation access roads, gravity and water are your absolute enemies. If an asphalt surface is not properly graded and crowned, severe rainstorms will bypass the surface, wash out the subgrade, and cause catastrophic pavement collapse.
            </p>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '15px', lineHeight: '1.8' }}>
              We specialize in extreme terrain excavation. Before laying any asphalt, our crews construct highly calculated water diversion swales, install heavy-duty culvert pipes, and aggressively compact a thick VDOT-spec #21A crushed stone base. Our mountain-grade hot mix asphalt is specifically formulated with high-polymer binders to prevent "downward creep" on steep inclines during intense summer heat.
            </p>
          </div>

          {/* NEW: SEO Content Silo - Tar and Chip Mastery */}
          <div style={{ marginBottom: '50px', background: 'rgba(0,0,0,0.4)', padding: '30px', borderLeft: '4px solid var(--powerhouse-red)' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '15px', color: 'var(--pure-white)' }}>Tar & Chip Paving (Macadam) in {parsedCity.cityOnly}</h3>
            <p style={{ fontSize: '1.15rem', color: '#ccc', marginBottom: '15px', lineHeight: '1.8' }}>
              For rural properties, long agricultural lanes, and expansive mountain driveways in {parsedCity.full}, standard asphalt can be cost-prohibitive and dangerously slick in the winter snow. That is why we are the premier installers of <strong>Tar and Chip paving</strong> in the region.
            </p>
            <p style={{ fontSize: '1.15rem', color: '#ccc', marginBottom: '0', lineHeight: '1.8' }}>
              Also known as chip seal or macadam, this process involves spraying a heavy coat of liquid asphalt emulsion directly onto a compacted base, followed immediately by an embedment of clean, crushed aggregate. The result is a highly durable, rustic-looking surface that provides <strong>massive tire traction for snowy mountain switchbacks</strong> while remaining virtually maintenance-free.
            </p>
          </div>

          {/* NEW: SEO Content Silo - Premium Estate Capabilities */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: 'var(--estate-gold)' }}>Luxury Estate Operations & Privacy</h3>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              When operating on high-end luxury estates and secluded rural properties in {parsedCity.cityOnly}, we prioritize minimal disruption and absolute privacy. Our crews mobilize highly efficient, self-contained heavy equipment fleets designed to execute massive structural paving projects rapidly. From grand entryway courtyards to miles-long private access roads, we deliver flawless aesthetic finishes worthy of the most exclusive properties in the Highlands.
            </p>
          </div>

        </div>
        <div style={{ flex: '1 1 50%', background: "url('/images/machinery.png') center/cover", minHeight: '600px' }}></div>
      </section>

      {/* Services Grid (Tailored for the city) */}
      <section style={{ padding: '100px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '3.5rem', color: 'var(--pure-white)', letterSpacing: '-1px' }}>Our Services in {cityName}</h2>
        </div>
        
        <div className="massive-grid">
          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('/images/hero.png')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Commercial Asphalt</h3>
              <p>Heavy-duty overlays, milling, and complete lot reconstruction for retail and industrial properties.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('/images/driveway.png')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Tar & Chip Paving</h3>
              <p>The ultimate high-traction, maintenance-free solution for steep rural driveways and long farm roads.</p>
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-bg" style={{ backgroundImage: "url('/images/sealcoating.png')" }}></div>
            <div className="grid-overlay"></div>
            <div className="grid-content">
              <h3>Industrial Sealcoating</h3>
              <p>High-solids asphalt emulsion to protect your investment from UV oxidation and freeze-thaw damage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Estimation Form Integration */}
      <section style={{ padding: '80px 20px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="gold-text" style={{ fontSize: '2.5rem' }}>Skip the Wait in {cityName}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '10px' }}>Initiate an orbital satellite scan of your property for a precise, instant estimate.</p>
          </div>
          <AIEstimationForm location={cityName} />
        </div>
      </section>

      {/* Visual Proof */}
      <VisualProofGallery />

    </main>
  )
}
