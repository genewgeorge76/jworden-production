import type { CSSProperties } from 'react';

const Hero = () => {
  const styles: {
    wrapper: CSSProperties;
    video: CSSProperties;
    overlay: CSSProperties;
    grid: CSSProperties;
    glow: CSSProperties;
    content: CSSProperties;
    badge: CSSProperties;
    heading: CSSProperties;
    headingGold: CSSProperties;
    tagline: CSSProperties;
    jwordenai: CSSProperties;
    ctaRow: CSSProperties;
    ctaPrimary: CSSProperties;
    ctaSecondary: CSSProperties;
  } = {
    wrapper: {
      position: 'relative',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a',
      color: '#FFF',
      fontFamily: '"Inter", sans-serif',
      padding: '96px 24px',
      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
    },
    video: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: 0,
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      background:
        'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.7) 50%, rgba(10,10,10,0.95) 100%)',
      zIndex: 1,
    },
    grid: {
      position: 'absolute',
      inset: 0,
      zIndex: 2,
      opacity: 0.04,
      backgroundImage:
        'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
      backgroundSize: '60px 60px',
    },
    glow: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '2px',
      zIndex: 3,
      background: 'linear-gradient(to right, transparent, #D4AF37, transparent)',
      boxShadow: '0 0 20px rgba(212, 175, 55, 0.8)',
    },
    content: {
      position: 'relative',
      zIndex: 10,
      maxWidth: '1100px',
      textAlign: 'center',
    },
    badge: {
      display: 'inline-block',
      color: '#D4AF37',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.35em',
      fontSize: '11px',
      marginBottom: '32px',
      border: '1px solid rgba(212, 175, 55, 0.4)',
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      padding: '10px 24px',
    },
    heading: {
      fontSize: 'clamp(32px, 6vw, 72px)',
      fontWeight: 300,
      textTransform: 'uppercase',
      color: '#FFF',
      lineHeight: 1.1,
      letterSpacing: '0.08em',
      margin: '0 0 8px 0',
    },
    headingGold: {
      fontSize: 'clamp(32px, 6vw, 72px)',
      fontWeight: 600,
      textTransform: 'uppercase',
      lineHeight: 1.1,
      letterSpacing: '0.06em',
      margin: '0 0 32px 0',
      background: 'linear-gradient(to right, #FCD34D, #D4AF37, #F5D67A)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
    },
    tagline: {
      fontSize: '18px',
      color: 'rgba(228, 228, 231, 0.9)',
      maxWidth: '640px',
      margin: '0 auto',
      fontWeight: 300,
      fontStyle: 'italic',
      letterSpacing: '0.05em',
    },
    jwordenai: {
      color: '#D4AF37',
      fontWeight: 600,
      fontStyle: 'normal',
      letterSpacing: '0.15em',
    },
    ctaRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      justifyContent: 'center',
      marginTop: '48px',
    },
    ctaPrimary: {
      display: 'inline-block',
      background: 'linear-gradient(to right, #FCD34D, #F5D67A)',
      color: '#000',
      padding: '16px 40px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      fontSize: '13px',
      textDecoration: 'none',
      boxShadow: '0 0 30px rgba(251, 191, 36, 0.4)',
    },
    ctaSecondary: {
      display: 'inline-block',
      border: '1px solid rgba(212, 175, 55, 0.5)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#D4AF37',
      padding: '16px 40px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      fontSize: '13px',
      textDecoration: 'none',
    },
  };

  return (
    <section style={styles.wrapper} aria-label="J. Worden & Sons Hero">
      <video
        autoPlay
        muted
        loop
        playsInline
        style={styles.video}
        poster="/asphalt-paving-with-paver.jpg"
      >
        <source src="/videos/industrial-paving-hero.mp4" type="video/mp4" />
      </video>
      <div style={styles.overlay} aria-hidden="true" />
      <div style={styles.grid} aria-hidden="true" />
      <div style={styles.glow} aria-hidden="true" />

      <div style={styles.content}>
        <span style={styles.badge}>
          4th Generation &middot; Est. 1984 &middot; Virginia Class A Licensed
        </span>
        <h1 style={styles.heading}>J. WORDEN &amp; SONS &mdash;</h1>
        <h1 style={styles.headingGold}>50-STATE COMMERCIAL ASPHALT INFRASTRUCTURE</h1>
        <p style={styles.tagline}>
          Powered by <span style={styles.jwordenai}>JWORDENAI&trade;</span> Predictive Logistics
          &amp; Pricing Optimization
        </p>
        <div style={styles.ctaRow}>
          <a href="tel:804-446-1296" style={styles.ctaPrimary}>
            &#9742; 804-446-1296
          </a>
          <a href="#contact" style={styles.ctaSecondary}>
            Request Command Briefing &rarr;
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
