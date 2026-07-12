import type { Metadata } from 'next'
import OrbitalMap from '@/components/os/OrbitalMap'

export const metadata: Metadata = {
  title: 'Command Center | JWorden OS',
  description: 'Private administration portal and orbital estimator.',
}

export default function CommandCenter() {
  return (
    <main style={{ background: '#000', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '40px' }}>
          <div>
            <h1 style={{ color: 'white', fontFamily: 'Bebas Neue', fontSize: '3rem', letterSpacing: '2px', margin: 0 }}>JWORDEN <span style={{ color: 'var(--powerhouse-red)' }}>OS</span></h1>
            <p style={{ color: '#888', fontFamily: 'monospace', margin: 0 }}>v2.0 // TACTICAL OPERATIONS DASHBOARD</p>
          </div>
          <div>
            <a href="/" style={{ color: '#aaa', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid #444', padding: '10px 20px', borderRadius: '4px' }}>EXIT TO PUBLIC SITE</a>
          </div>
        </header>

        {/* The Core Orbital Estimator */}
        <section>
          <OrbitalMap />
        </section>

        {/* Future Integrations / Placeholder Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginTop: '40px' }}>
          
          <div style={{ background: '#111', border: '1px solid #333', padding: '30px', borderRadius: '8px' }}>
            <h3 style={{ color: 'white', fontFamily: 'Bebas Neue', fontSize: '1.5rem', marginBottom: '15px' }}>LEAD INBOX</h3>
            <p style={{ color: '#666', fontFamily: 'monospace' }}>No active leads in queue. SMS routing is active.</p>
          </div>

          <div style={{ background: '#111', border: '1px solid #333', padding: '30px', borderRadius: '8px' }}>
            <h3 style={{ color: 'white', fontFamily: 'Bebas Neue', fontSize: '1.5rem', marginBottom: '15px' }}>FLEET LOGISTICS</h3>
            <p style={{ color: '#666', fontFamily: 'monospace' }}>GPS tracking offline. Pending API configuration.</p>
          </div>

          <div style={{ background: '#111', border: '1px solid #333', padding: '30px', borderRadius: '8px' }}>
            <h3 style={{ color: 'white', fontFamily: 'Bebas Neue', fontSize: '1.5rem', marginBottom: '15px' }}>AUTOMATED CONTRACTS</h3>
            <p style={{ color: '#666', fontFamily: 'monospace' }}>DocuSign API offline. Waiting for authorization.</p>
          </div>

        </section>

      </div>
    </main>
  )
}
