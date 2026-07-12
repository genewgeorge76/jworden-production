import { useState, type CSSProperties } from 'react';

type Project = {
  id: string;
  sector: 'COMMERCIAL' | 'MUNICIPAL' | 'ESTATE';
  client: string;
  location: string;
  finish: string;
  img: string;
  blurb: string;
};

const PROJECTS: ReadonlyArray<Project> = [
  {
    id: 'cvs-richmond',
    sector: 'COMMERCIAL',
    client: 'CVS Retail Lot',
    location: 'Richmond, VA',
    finish: 'Zero-Mark Overlay',
    img: '/cvs-asphalt-paving.jpg',
    blurb: 'Full lot overhaul delivered without closing the retail floor.',
  },
  {
    id: 'auto-lot-midlothian',
    sector: 'COMMERCIAL',
    client: 'Auto Dealership Lot',
    location: 'Midlothian, VA',
    finish: '96% Marshall Compaction',
    img: '/asphalt-paving-car-lot-on-midlothian.jpg',
    blurb: 'Heavy-duty vehicle-grade surface engineered for rotating inventory.',
  },
  {
    id: 'office-park-richmond',
    sector: 'COMMERCIAL',
    client: 'Office Park Campus',
    location: 'Richmond, VA',
    finish: 'ADA-Compliant Striping',
    img: '/parking-lot-pave-richmond-va.jpg',
    blurb: 'Multi-tenant corporate lot with full stripe and accessibility buildout.',
  },
  {
    id: 'route-17',
    sector: 'MUNICIPAL',
    client: 'State Route 17 Artery',
    location: 'Stafford, VA',
    finish: 'VDOT Section 315',
    img: '/asphalt-paving-with-paver.jpg',
    blurb: '1,200-ton resurfacing to 96% Marshall Density on live traffic artery.',
  },
  {
    id: 'estate-chesterfield',
    sector: 'ESTATE',
    client: 'Private Estate Drive',
    location: 'Chesterfield, VA',
    finish: 'Console-Edged Finish',
    img: '/asphalt-driveway-chesterfield-va.jpg',
    blurb: 'Masonry-edged estate driveway with hand-rolled Zero-Mark transitions.',
  },
  {
    id: 'estate-maidstone',
    sector: 'ESTATE',
    client: 'Maidstone Residence',
    location: 'Central Virginia',
    finish: 'Sovereign Gold Standard',
    img: '/jwordenandsonspaving-maidstone-photo.jpeg',
    blurb: 'Signature residential estate install with 6-inch structural stone base.',
  },
];

const SECTORS: ReadonlyArray<Project['sector'] | 'ALL'> = [
  'ALL',
  'COMMERCIAL',
  'MUNICIPAL',
  'ESTATE',
];

const Portfolio = () => {
  const [activeSector, setActiveSector] = useState<Project['sector'] | 'ALL'>('ALL');
  const visible = activeSector === 'ALL' ? PROJECTS : PROJECTS.filter((p) => p.sector === activeSector);

  const styles: {
    wrapper: CSSProperties;
    header: CSSProperties;
    eyebrow: CSSProperties;
    heading: CSSProperties;
    subheading: CSSProperties;
    divider: CSSProperties;
    filterRow: CSSProperties;
    filterButton: (active: boolean) => CSSProperties;
    grid: CSSProperties;
    card: CSSProperties;
    imageWrap: CSSProperties;
    image: CSSProperties;
    caption: CSSProperties;
    sectorTag: CSSProperties;
    client: CSSProperties;
    meta: CSSProperties;
    finish: CSSProperties;
    blurb: CSSProperties;
  } = {
    wrapper: {
      padding: '96px 24px',
      backgroundColor: '#000',
      color: '#FFF',
      fontFamily: '"Inter", sans-serif',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    },
    header: {
      maxWidth: '1200px',
      margin: '0 auto 48px auto',
      textAlign: 'center',
    },
    eyebrow: {
      display: 'inline-block',
      color: 'rgba(212, 175, 55, 0.7)',
      textTransform: 'uppercase',
      letterSpacing: '0.35em',
      fontSize: '11px',
      fontWeight: 600,
      marginBottom: '16px',
    },
    heading: {
      fontSize: 'clamp(28px, 4vw, 48px)',
      fontWeight: 300,
      textTransform: 'uppercase',
      color: '#FFF',
      letterSpacing: '0.08em',
      margin: 0,
    },
    subheading: {
      color: '#D4AF37',
      fontWeight: 600,
    },
    divider: {
      width: '96px',
      height: '1px',
      margin: '24px auto 0 auto',
      background: 'linear-gradient(to right, transparent, #D4AF37, transparent)',
      boxShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
    },
    filterRow: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '10px',
      maxWidth: '1200px',
      margin: '0 auto 40px auto',
    },
    filterButton: (active) => ({
      padding: '10px 20px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      border: '1px solid',
      borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.1)',
      backgroundColor: active ? '#D4AF37' : 'rgba(255,255,255,0.02)',
      color: active ? '#000' : '#aaa',
      transition: 'all 0.2s ease',
      borderRadius: '4px',
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    card: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#0D0D0D',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      transition: 'border-color 0.3s ease',
    },
    imageWrap: {
      position: 'relative',
      aspectRatio: '4 / 3',
      overflow: 'hidden',
      backgroundColor: '#111',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
    caption: {
      padding: '20px',
      borderTop: '1px solid rgba(212, 175, 55, 0.2)',
    },
    sectorTag: {
      color: '#D4AF37',
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.25em',
      marginBottom: '8px',
    },
    client: {
      color: '#FFF',
      fontSize: '18px',
      fontWeight: 600,
      margin: '0 0 4px 0',
    },
    meta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      fontSize: '12px',
      color: '#888',
    },
    finish: {
      color: '#D4AF37',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      fontSize: '10px',
    },
    blurb: {
      color: '#aaa',
      fontSize: '13px',
      lineHeight: 1.5,
      marginTop: '12px',
      fontWeight: 300,
    },
  };

  return (
    <section style={styles.wrapper} aria-label="J. Worden Portfolio">
      <div style={styles.header}>
        <span style={styles.eyebrow}>The Zero-Mark Portfolio</span>
        <h2 style={styles.heading}>
          Signature <span style={styles.subheading}>Worden Finishes</span>
        </h2>
        <div style={styles.divider} aria-hidden="true" />
      </div>

      <div style={styles.filterRow} role="tablist" aria-label="Filter portfolio by sector">
        {SECTORS.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={activeSector === s}
            onClick={() => setActiveSector(s)}
            style={styles.filterButton(activeSector === s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {visible.map((p) => (
          <article key={p.id} style={styles.card}>
            <div style={styles.imageWrap}>
              <img
                src={p.img}
                alt={`${p.client} — ${p.location}`}
                style={styles.image}
                loading="lazy"
              />
            </div>
            <div style={styles.caption}>
              <div style={styles.sectorTag}>{p.sector}</div>
              <h3 style={styles.client}>{p.client}</h3>
              <div style={styles.meta}>
                <span>{p.location}</span>
                <span style={styles.finish}>{p.finish}</span>
              </div>
              <p style={styles.blurb}>{p.blurb}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Portfolio;
