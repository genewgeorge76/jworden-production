import { useState, type CSSProperties } from 'react';

const TRADITIONAL_COST_PER_SQFT = 4.5;
const WORDEN_COST_PER_SQFT = 5.25;
const TRADITIONAL_LIFESPAN_YEARS = 10;
const WORDEN_LIFESPAN_YEARS = 17;

function calculateROI(sqFt: number) {
  const traditionalCost = sqFt * TRADITIONAL_COST_PER_SQFT;
  const wordenCost = sqFt * WORDEN_COST_PER_SQFT;

  const costPerYearTraditional = traditionalCost / TRADITIONAL_LIFESPAN_YEARS;
  const costPerYearWorden = wordenCost / WORDEN_LIFESPAN_YEARS;

  return {
    savings: Math.round(costPerYearTraditional - costPerYearWorden),
    totalEfficiency: ((WORDEN_LIFESPAN_YEARS / TRADITIONAL_LIFESPAN_YEARS) * 100).toFixed(1),
  };
}

const SovereignAssetAnalysis = () => {
  const [sqFt, setSqFt] = useState(5000);
  const roi = calculateROI(sqFt);

  const styles: {
    panel: CSSProperties;
    header: CSSProperties;
    title: CSSProperties;
    subtitle: CSSProperties;
    grid: CSSProperties;
    card: CSSProperties;
    cardTitle: CSSProperties;
    highlight: CSSProperties;
    slider: CSSProperties;
    caption: CSSProperties;
    pulse: CSSProperties;
    quote: CSSProperties;
  } = {
    panel: {
      backgroundColor: '#050505',
      border: '2px solid #D4AF37',
      borderRadius: '20px',
      padding: '30px',
      color: '#FFF',
      fontFamily: '"Inter", sans-serif',
      maxWidth: '800px',
      margin: '40px auto',
      boxShadow: '0 0 50px rgba(212, 175, 55, 0.2)',
    },
    header: {
      borderBottom: '1px solid #333',
      paddingBottom: '20px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    title: {
      color: '#D4AF37',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      margin: 0,
    },
    subtitle: {
      color: '#888',
      marginTop: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
    },
    card: {
      background: '#111',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #222',
      textAlign: 'center',
    },
    cardTitle: {
      margin: 0,
      marginBottom: '8px',
    },
    highlight: {
      color: '#D4AF37',
      fontSize: '24px',
      fontWeight: 'bold',
      display: 'block',
      margin: '10px 0',
    },
    slider: {
      width: '100%',
      margin: '20px 0',
      accentColor: '#D4AF37',
    },
    caption: {
      fontSize: '12px',
      color: '#666',
    },
    pulse: {
      marginTop: '10px',
      fontSize: '11px',
      color: '#00FF00',
    },
    quote: {
      marginTop: '30px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#888',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h2 style={styles.title}>Sovereign Asset Analysis</h2>
        <p style={styles.subtitle}>Engineering 22nd-Century Infrastructure for the Commonwealth</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>The Worden Multiplier</h3>
          <input
            type="range"
            min={1000}
            max={50000}
            step={500}
            value={sqFt}
            onChange={(e) => setSqFt(Number(e.target.value))}
            style={styles.slider}
            aria-label="Project size in square feet"
          />
          <p>
            Project Size: <strong>{sqFt.toLocaleString()} Sq Ft</strong>
          </p>
          <span style={styles.highlight}>${roi.savings.toLocaleString()}/Year</span>
          <p style={styles.caption}>Annual Savings vs Traditional Paving</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Sunday Protocol&trade;</h3>
          <span style={styles.highlight}>{roi.totalEfficiency}%</span>
          <p>Higher Lifespan Efficiency</p>
          <div style={styles.pulse}>&#9679; System Active: Zero Monday Downtime</div>
        </div>
      </div>

      <div style={styles.quote}>
        &ldquo;We don&rsquo;t just cover dirt; we engineer a legacy foundation.&rdquo; &mdash; J. Worden
      </div>
    </div>
  );
};

export default SovereignAssetAnalysis;
