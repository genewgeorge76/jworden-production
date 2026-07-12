import type { CSSProperties } from 'react';

const STATS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Sovereign States', value: '50' },
  { label: 'Commercial Assets Paved', value: '1,240+' },
  { label: 'Sunday Protocol Success', value: '100%' },
  { label: 'Generations of Iron', value: '4' },
];

const GlobalGrid = () => {
  const styles: {
    wrapper: CSSProperties;
    hqBadge: CSSProperties;
    heading: CSSProperties;
    statGrid: CSSProperties;
    statCard: CSSProperties;
    value: CSSProperties;
    label: CSSProperties;
    mapSection: CSSProperties;
    mapTitle: CSSProperties;
    mapBody: CSSProperties;
    divider: CSSProperties;
  } = {
    wrapper: {
      padding: '60px 20px',
      backgroundColor: '#000',
      color: '#FFF',
      fontFamily: '"Inter", sans-serif',
      textAlign: 'center',
    },
    hqBadge: {
      display: 'inline-block',
      padding: '10px 20px',
      border: '1px solid #D4AF37',
      borderRadius: '50px',
      fontSize: '14px',
      color: '#D4AF37',
      marginBottom: '20px',
    },
    heading: {
      fontSize: '36px',
      marginBottom: '40px',
      fontWeight: 800,
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '30px',
      maxWidth: '1200px',
      margin: '0 auto 50px auto',
    },
    statCard: {
      padding: '20px',
      borderBottom: '2px solid #D4AF37',
    },
    value: {
      fontSize: '42px',
      fontWeight: 900,
      color: '#D4AF37',
      display: 'block',
    },
    label: {
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      color: '#888',
    },
    mapSection: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px',
      background: 'radial-gradient(circle, #111 0%, #000 100%)',
      borderRadius: '30px',
      border: '1px solid #222',
    },
    mapTitle: {
      color: '#D4AF37',
      marginBottom: '10px',
    },
    mapBody: {
      color: '#666',
      fontSize: '14px',
      maxWidth: '600px',
      margin: '0 auto',
    },
    divider: {
      marginTop: '40px',
      height: '2px',
      background: 'linear-gradient(to right, transparent, #D4AF37, transparent)',
    },
  };

  return (
    <section style={styles.wrapper} aria-label="Worden Alliance Footprint">
      <div style={styles.hqBadge}>
        &#9679; COMMAND CENTER: 1601 Ware Bottom Spring Rd, Chester, VA
      </div>

      <h2 style={styles.heading}>THE WORDEN ALLIANCE FOOTPRINT</h2>

      <div style={styles.statGrid}>
        {STATS.map((s) => (
          <div key={s.label} style={styles.statCard}>
            <span style={styles.value}>{s.value}</span>
            <span style={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.mapSection}>
        <h3 style={styles.mapTitle}>NATIONAL REACH. VIRGINIA ROOTS.</h3>
        <p style={styles.mapBody}>
          From our Chester headquarters, we coordinate specialized paving sprints across
          all 50 states. Our JWordenAI&trade; logic ensures that whether we are in Richmond
          or Michigan, the Gold Standard remains absolute.
        </p>
        <div style={styles.divider} />
      </div>
    </section>
  );
};

export default GlobalGrid;
