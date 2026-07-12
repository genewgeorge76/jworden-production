import type { CSSProperties, ReactNode } from 'react';

/**
 * SuccessScreen — Porsche-grade gold-on-black confirmation panel shown after
 * a visitor completes a high-intent action (lead capture, contract ready,
 * site-visit scheduled). Matches the JarvisForeman / CommandCenter aesthetic.
 */

interface SuccessScreenProps {
  title?: string;
  subtitle?: string;
  primaryMetricLabel?: string;
  primaryMetricValue?: string;
  footnote?: string;
  ctaHref?: string;
  ctaLabel?: string;
  children?: ReactNode;
}

export default function SuccessScreen({
  title = 'Dispatch Received',
  subtitle = 'A Worden estimator has been assigned. Expect contact within 24 hours.',
  primaryMetricLabel,
  primaryMetricValue,
  footnote = 'Chester HQ &middot; 4th Generation Since 1984',
  ctaHref = 'tel:8044461296',
  ctaLabel = 'Call the Foreman: 804-446-1296',
  children,
}: SuccessScreenProps) {
  const styles: Record<string, CSSProperties> = {
    wrapper: {
      backgroundColor: '#050505',
      border: '2px solid #D4AF37',
      borderRadius: '20px',
      padding: '40px 30px',
      color: '#FFFFFF',
      fontFamily: '"Inter", sans-serif',
      maxWidth: '640px',
      margin: '40px auto',
      boxShadow: '0 0 60px rgba(212, 175, 55, 0.25)',
      textAlign: 'center',
    },
    seal: {
      width: '72px',
      height: '72px',
      borderRadius: '50%',
      border: '2px solid #D4AF37',
      backgroundColor: '#111',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      color: '#D4AF37',
      fontSize: '32px',
      fontWeight: 900,
      boxShadow: '0 0 24px rgba(212, 175, 55, 0.35)',
    },
    title: {
      color: '#D4AF37',
      fontSize: '24px',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '3px',
      marginBottom: '12px',
    },
    subtitle: {
      color: '#CCCCCC',
      fontSize: '14px',
      lineHeight: 1.6,
      maxWidth: '480px',
      margin: '0 auto 28px auto',
    },
    metric: {
      backgroundColor: '#111',
      border: '1px solid #222',
      borderRadius: '12px',
      padding: '20px',
      display: 'inline-block',
      marginBottom: '28px',
    },
    metricLabel: {
      color: '#888',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '2px',
    },
    metricValue: {
      color: '#D4AF37',
      fontSize: '28px',
      fontWeight: 900,
      display: 'block',
      marginTop: '6px',
    },
    cta: {
      display: 'inline-block',
      backgroundColor: '#D4AF37',
      color: '#000',
      padding: '14px 28px',
      borderRadius: '10px',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '2px',
      fontSize: '13px',
      textDecoration: 'none',
      transition: 'background-color 0.2s ease',
    },
    pulse: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#00FF00',
      display: 'inline-block',
      marginRight: '10px',
      boxShadow: '0 0 8px #00FF00',
      verticalAlign: 'middle',
    },
    status: {
      color: '#00FF00',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      marginBottom: '16px',
    },
    footnote: {
      marginTop: '24px',
      color: '#555',
      fontSize: '11px',
      fontStyle: 'italic',
      letterSpacing: '1px',
    },
    body: {
      marginBottom: '24px',
      color: '#AAA',
      fontSize: '13px',
    },
  };

  return (
    <div role="status" aria-live="polite" style={styles.wrapper}>
      <div style={styles.status}>
        <span style={styles.pulse} aria-hidden="true" />
        Dispatch Confirmed &middot; Systems Online
      </div>
      <div style={styles.seal} aria-hidden="true">&#10003;</div>
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.subtitle}>{subtitle}</p>

      {primaryMetricValue && (
        <div style={styles.metric}>
          {primaryMetricLabel && <div style={styles.metricLabel}>{primaryMetricLabel}</div>}
          <span style={styles.metricValue}>{primaryMetricValue}</span>
        </div>
      )}

      {children && <div style={styles.body}>{children}</div>}

      <div>
        <a style={styles.cta} href={ctaHref}>{ctaLabel}</a>
      </div>

      <div style={styles.footnote} dangerouslySetInnerHTML={{ __html: footnote }} />
    </div>
  );
}
