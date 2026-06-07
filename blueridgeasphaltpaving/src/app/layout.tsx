import type { Metadata } from 'next'
import './globals.css'
import { Phone, MapPin } from 'lucide-react'
import GeoSchema from '@/components/GeoSchema'

export const metadata: Metadata = {
  title: 'Blue Ridge Estate Paving | Instant AI Satellite Paving Estimates',
  description: 'Top-rated asphalt paving contractor in Chester & Richmond VA. Skip the wait and get an instant AI Satellite Scan for your commercial or residential project.',
  keywords: 'Asphalt Paving, Commercial Paving, Sealcoating, Blue Ridge Estate Paving, Parking Lot Maintenance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Injecting the exact Montserrat font used by Rose Paving */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <GeoSchema />
      </head>
      <body suppressHydrationWarning>
        {/* The Black & White Top Bar */}
        <div className="top-bar">
          <div>
            OPERATING FOR OVER 40 YEARS | INDEPENDENTLY OWNED
          </div>
          <div style={{ display: 'flex', gap: '30px' }}>
            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="#d32f2f" /> ROANOKE, VA</span>
            <span style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#d32f2f', fontWeight: '800'}}><Phone size={16} /> (804) 446-1296</span>
          </div>
        </div>
        
        {/* The White & Red Navbar */}
        <nav className="navbar">
          <div className="logo">
            <a href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
              BLUE RIDGE <span style="color:var(--powerhouse-red)">ESTATE PAVING</span>
            </a>
          </div>
          <div className="nav-links">
            <a href="/commercial-paving" className="nav-link">Commercial</a>
            <a href="/residential-driveways" className="nav-link">Residential</a>
            <a href="/asphalt-milling" className="nav-link">Milling</a>
            <a href="/sealcoating-maintenance" className="nav-link">Maintenance</a>
            <a href="/insights" className="nav-link" style={{ color: 'var(--powerhouse-red)' }}>Insights</a>
            <a href="/#contact" className="btn-primary">Get a Quote</a>
          </div>
        </nav>
        
        {children}
        
        {/* The Massive Carbon Black Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>Blue Ridge Estate Paving</h3>
              <p style={{color: '#aaa', fontSize: '1.1rem', fontWeight: '500', lineHeight: '1.8'}}>
                We provide superior asphalt and concrete solutions for commercial and residential properties. With over four decades of operational excellence, we are the authority in pavement maintenance.
              </p>
              <div style={{ marginTop: '15px' }}>
                <p style={{color: '#fff', fontSize: '1rem', fontWeight: 'bold'}}><Phone size={14} style={{ display: 'inline', marginRight: '5px' }}/> (804) 446-1296</p>
                <p style={{color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginTop: '5px'}}>Email: j.wordenandsonspaving@gmail.com</p>
              </div>
              <p style={{color: '#d32f2f', marginTop: '20px', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.9rem'}}>
                *Not affiliated with Worden Paving.
              </p>
            </div>
            <div className="footer-col">
              <h3>National-Grade Services</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><a href="/richmond-va" style={{ color: '#aaa', textDecoration: 'none' }}>Roanoke VA (Local)</a></li>
                <li><a href="/commercial-paving" style={{ color: '#aaa', textDecoration: 'none' }}>Commercial Paving</a></li>
                <li><a href="/residential-driveways" style={{ color: '#aaa', textDecoration: 'none' }}>Residential Driveways</a></li>
                <li><a href="/sealcoating-maintenance" style={{ color: '#aaa', textDecoration: 'none' }}>Sealcoating & Maintenance</a></li>
                <li><a href="/asphalt-milling" style={{ color: '#aaa', textDecoration: 'none' }}>Asphalt Milling</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Virginia Service Hubs</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <li><a href="/richmond-va" style={{ color: '#aaa', textDecoration: 'none' }}>Richmond, VA</a></li>
                <li><a href="/the-fan-district" style={{ color: '#aaa', textDecoration: 'none' }}>The Fan District</a></li>
                <li><a href="/museum-district" style={{ color: '#aaa', textDecoration: 'none' }}>Museum District</a></li>
                <li><a href="/church-hill" style={{ color: '#aaa', textDecoration: 'none' }}>Church Hill</a></li>
                <li><a href="/scotts-addition" style={{ color: '#aaa', textDecoration: 'none' }}>Scott's Addition</a></li>
                <li><a href="/windsor-farms" style={{ color: '#aaa', textDecoration: 'none' }}>Windsor Farms</a></li>
                <li><a href="/west-end-richmond" style={{ color: '#aaa', textDecoration: 'none' }}>West End Richmond</a></li>
                <li><a href="/stratford-hills" style={{ color: '#aaa', textDecoration: 'none' }}>Stratford Hills</a></li>
                <li><a href="/henrico-va" style={{ color: '#aaa', textDecoration: 'none' }}>Henrico & Short Pump</a></li>
                <li><a href="/23221" style={{ color: '#aaa', textDecoration: 'none' }}>23221 (Carytown)</a></li>
                <li><a href="/chester-va" style={{ color: '#aaa', textDecoration: 'none' }}>Chester, VA</a></li>
                <li><a href="/chesterfield-va" style={{ color: '#aaa', textDecoration: 'none' }}>Chesterfield County</a></li>
                <li><a href="/midlothian-va" style={{ color: '#aaa', textDecoration: 'none' }}>Midlothian, VA</a></li>
                <li><a href="/new-kent-va" style={{ color: '#aaa', textDecoration: 'none' }}>New Kent, VA</a></li>
                <li><a href="/williamsburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Williamsburg, VA</a></li>
                <li><a href="/hanover-va" style={{ color: '#aaa', textDecoration: 'none' }}>Hanover, VA</a></li>
                <li><a href="/ashland-va" style={{ color: '#aaa', textDecoration: 'none' }}>Ashland, VA</a></li>
                <li><a href="/powhatan-va" style={{ color: '#aaa', textDecoration: 'none' }}>Powhatan, VA</a></li>
                <li><a href="/goochland-va" style={{ color: '#aaa', textDecoration: 'none' }}>Goochland, VA</a></li>
                <li><a href="/hopewell-va" style={{ color: '#aaa', textDecoration: 'none' }}>Hopewell, VA</a></li>
                <li><a href="/prince-george-va" style={{ color: '#aaa', textDecoration: 'none' }}>Prince George, VA</a></li>
                <li><a href="/fredericksburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Fredericksburg, VA</a></li>
                <li><a href="/petersburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Petersburg, VA</a></li>
                <li><a href="/mechanicsville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Mechanicsville, VA</a></li>
                <li><a href="/colonial-heights-va" style={{ color: '#aaa', textDecoration: 'none' }}>Colonial Heights, VA</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Blue Ridge Estate Paving. All Rights Reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
