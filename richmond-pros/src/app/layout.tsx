import type { Metadata } from 'next'
import './globals.css'
import { Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import GeoSchema from '@/components/GeoSchema'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.jwordenasphaltpaving.com'),
  title: {
    template: '%s | J. Worden & Sons Paving LLC',
    default: 'J. Worden & Sons Paving LLC | Instant AI Satellite Paving Estimates',
  },
  description: 'Top-rated asphalt paving contractor in Chester & Richmond VA. Skip the wait and get an instant AI Satellite Scan for your commercial or residential project.',
  keywords: 'Asphalt Paving, Commercial Paving, Sealcoating, J. Worden Paving, Parking Lot Maintenance',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'J. Worden & Sons Paving LLC | Commercial & Residential Paving',
    description: 'Top-rated asphalt paving contractor in Chester & Richmond VA. Over 40 years of operational excellence.',
    url: 'https://www.jwordenasphaltpaving.com',
    siteName: 'J. Worden & Sons Paving',
    images: [
      {
        url: '/images/hero.png',
        width: 1200,
        height: 630,
        alt: 'J. Worden & Sons Asphalt Paving Operation in Richmond VA',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'J. Worden & Sons Paving LLC | Asphalt Experts',
    description: 'Top-rated asphalt paving contractor in Chester & Richmond VA. Get an instant satellite estimate.',
    images: ['/images/hero.png'],
  },
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
            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="#d32f2f" /> CHESTER, VA</span>
            <a href="tel:8044461296" style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#d32f2f', fontWeight: '800', textDecoration: 'none'}}><Phone size={16} /> (804) 446-1296</a>
          </div>
        </div>
        
        {/* The White & Red Navbar */}
        <nav className="navbar">
          <div className="logo">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
              J. WORDEN & SONS <span>PAVING</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link href="/commercial-paving" className="nav-link">Commercial</Link>
            <Link href="/residential-driveways" className="nav-link">Residential</Link>
            <Link href="/asphalt-milling" className="nav-link">Milling</Link>
            <Link href="/sealcoating-maintenance" className="nav-link">Maintenance</Link>
            <Link href="/insights" className="nav-link" style={{ color: 'var(--powerhouse-red)' }}>Insights</Link>
            <Link href="/#contact" className="btn-primary">Get a Quote</Link>
          </div>
        </nav>
        
        {children}
        
        {/* The Massive Carbon Black Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>J. Worden & Sons Paving LLC</h3>
              <p style={{color: '#aaa', fontSize: '1.1rem', fontWeight: '500', lineHeight: '1.8'}}>
                We provide superior asphalt and concrete solutions for commercial and residential properties. With over four decades of operational excellence, we are the authority in pavement maintenance.
              </p>
              <div style={{ marginTop: '15px' }}>
                <a href="tel:8044461296" style={{color: '#fff', fontSize: '1rem', fontWeight: 'bold', display: 'block', textDecoration: 'none'}}><Phone size={14} style={{ display: 'inline', marginRight: '5px' }}/> (804) 446-1296</a>
                <p style={{color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginTop: '5px'}}>Email: j.wordenandsonspaving@gmail.com</p>
              </div>
              <p style={{color: '#d32f2f', marginTop: '20px', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.9rem'}}>
                *Not affiliated with Worden Paving.
              </p>
            </div>
            <div className="footer-col">
              <h3>National-Grade Services</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><Link href="/richmond-va" style={{ color: '#aaa', textDecoration: 'none' }}>Richmond VA (Local)</Link></li>
                <li><Link href="/commercial-paving" style={{ color: '#aaa', textDecoration: 'none' }}>Commercial Paving</Link></li>
                <li><Link href="/residential-driveways" style={{ color: '#aaa', textDecoration: 'none' }}>Residential Driveways</Link></li>
                <li><Link href="/sealcoating-maintenance" style={{ color: '#aaa', textDecoration: 'none' }}>Sealcoating & Maintenance</Link></li>
                <li><Link href="/asphalt-milling" style={{ color: '#aaa', textDecoration: 'none' }}>Asphalt Milling</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Virginia Service Hubs</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <li><Link href="/richmond-va" style={{ color: '#aaa', textDecoration: 'none' }}>Richmond, VA</Link></li>
                <li><Link href="/the-fan-district" style={{ color: '#aaa', textDecoration: 'none' }}>The Fan District</Link></li>
                <li><Link href="/museum-district" style={{ color: '#aaa', textDecoration: 'none' }}>Museum District</Link></li>
                <li><Link href="/church-hill" style={{ color: '#aaa', textDecoration: 'none' }}>Church Hill</Link></li>
                <li><Link href="/scotts-addition" style={{ color: '#aaa', textDecoration: 'none' }}>Scott&apos;s Addition</Link></li>
                <li><Link href="/windsor-farms" style={{ color: '#aaa', textDecoration: 'none' }}>Windsor Farms</Link></li>
                <li><Link href="/west-end-richmond" style={{ color: '#aaa', textDecoration: 'none' }}>West End Richmond</Link></li>
                <li><Link href="/stratford-hills" style={{ color: '#aaa', textDecoration: 'none' }}>Stratford Hills</Link></li>
                <li><Link href="/henrico-va" style={{ color: '#aaa', textDecoration: 'none' }}>Henrico & Short Pump</Link></li>
                <li><Link href="/23221" style={{ color: '#aaa', textDecoration: 'none' }}>23221 (Carytown)</Link></li>
                <li><Link href="/chester-va" style={{ color: '#aaa', textDecoration: 'none' }}>Chester, VA</Link></li>
                <li><Link href="/chesterfield-va" style={{ color: '#aaa', textDecoration: 'none' }}>Chesterfield County</Link></li>
                <li><Link href="/midlothian-va" style={{ color: '#aaa', textDecoration: 'none' }}>Midlothian, VA</Link></li>
                <li><Link href="/new-kent-va" style={{ color: '#aaa', textDecoration: 'none' }}>New Kent, VA</Link></li>
                <li><Link href="/williamsburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Williamsburg, VA</Link></li>
                <li><Link href="/hanover-va" style={{ color: '#aaa', textDecoration: 'none' }}>Hanover, VA</Link></li>
                <li><Link href="/ashland-va" style={{ color: '#aaa', textDecoration: 'none' }}>Ashland, VA</Link></li>
                <li><Link href="/powhatan-va" style={{ color: '#aaa', textDecoration: 'none' }}>Powhatan, VA</Link></li>
                <li><Link href="/goochland-va" style={{ color: '#aaa', textDecoration: 'none' }}>Goochland, VA</Link></li>
                <li><Link href="/hopewell-va" style={{ color: '#aaa', textDecoration: 'none' }}>Hopewell, VA</Link></li>
                <li><Link href="/prince-george-va" style={{ color: '#aaa', textDecoration: 'none' }}>Prince George, VA</Link></li>
                <li><Link href="/fredericksburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Fredericksburg, VA</Link></li>
                <li><Link href="/petersburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Petersburg, VA</Link></li>
                <li><Link href="/mechanicsville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Mechanicsville, VA</Link></li>
                <li><Link href="/colonial-heights-va" style={{ color: '#aaa', textDecoration: 'none' }}>Colonial Heights, VA</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} J. Worden & Sons Paving LLC. All Rights Reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
