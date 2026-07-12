import { useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';

const GOLD = '#D4AF37';

const styles = {
  perspectiveContainer: {
    perspective: '1000px',
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
  } as CSSProperties,
  wordenCard: {
    width: '320px',
    background: 'rgba(18, 18, 18, 0.85)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    border: `1px solid ${GOLD}4D`,
    borderRadius: '24px',
    padding: '20px',
    transition: 'transform 0.1s ease-out',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    willChange: 'transform',
    fontFamily: '"Inter", sans-serif',
  } satisfies CSSProperties,
  goldGlow: {
    color: GOLD,
    textShadow: `0 0 10px ${GOLD}80`,
    fontWeight: 900,
    letterSpacing: '1px',
    margin: 0,
  } as CSSProperties,
} as const;

const MrWorden3D = () => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const tiltFromPoint = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setRotateX((y - 0.5) * -20);
    setRotateY((x - 0.5) * 20);
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    tiltFromPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    tiltFromPoint(touch.clientX, touch.clientY, e.currentTarget.getBoundingClientRect());
  };

  const reset = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const cardStyle: CSSProperties = {
    ...styles.wordenCard,
    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
  };

  return (
    <div
      style={styles.perspectiveContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      onTouchMove={handleTouchMove}
      onTouchEnd={reset}
      onTouchCancel={reset}
      aria-label="Mr. Worden sovereign status card"
    >
      <div style={cardStyle}>
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px', letterSpacing: '2px' }}>
          SOVEREIGN PATRIARCH
        </div>
        <h2 style={styles.goldGlow}>MR. WORDEN</h2>
        <div style={{ fontSize: '14px', lineHeight: 1.4, marginTop: '10px', color: '#EEE' }}>
          &ldquo;The &rsquo;04 Mack is on the ground in Charlotte. I&rsquo;m researching the red clay
          expansion for you while we prep for the Richmond 23221 sprint. Shall we audit the subgrade?&rdquo;
        </div>
        <div
          style={{
            marginTop: '20px',
            borderTop: '1px solid #333',
            paddingTop: '10px',
            fontSize: '12px',
            color: '#CCC',
          }}
        >
          <span style={{ color: '#00FF00' }}>&bull;</span> 50-STATE RESEARCH ACTIVE
        </div>
      </div>
    </div>
  );
};

export default MrWorden3D;
