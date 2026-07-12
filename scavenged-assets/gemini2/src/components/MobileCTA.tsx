/**
 * MobileCTA — Sticky bottom bar with Call + Text buttons.
 * Only shows on mobile (<768px). Tracks conversions via gtag.
 */
export default function MobileCTA() {
  const track = (action: string) => {
    if (typeof window !== 'undefined' && (window as any).track_conversion) {
      (window as any).track_conversion(action, 'mobile_cta');
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] md:hidden"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.85))',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(245,158,11,0.3)',
        padding: '10px 16px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}
    >
      <div style={{ display: 'flex', gap: '10px' }}>
        <a
          href="tel:+18044461296"
          onClick={() => track('phone_call')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 0',
            background: '#f59e0b',
            color: '#000',
            fontWeight: 700,
            fontSize: '15px',
            borderRadius: '8px',
            textDecoration: 'none',
            letterSpacing: '0.02em',
          }}
        >
          📞 Call Now
        </a>
        <a
          href="sms:+18044461296?body=Hi%2C%20I%27d%20like%20a%20free%20paving%20estimate."
          onClick={() => track('text_message')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 0',
            background: 'transparent',
            color: '#f59e0b',
            fontWeight: 700,
            fontSize: '15px',
            borderRadius: '8px',
            textDecoration: 'none',
            border: '2px solid #f59e0b',
            letterSpacing: '0.02em',
          }}
        >
          💬 Text Me
        </a>
      </div>
    </div>
  );
}
