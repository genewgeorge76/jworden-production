import type { Metadata } from 'next'
import './globals.css'
import { Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import GeoSchema from '@/components/GeoSchema'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.blueridgeasphaltpaving.com'),
  title: {
    template: '%s | Blue Ridge Estate Paving',
    default: 'Blue Ridge Estate Paving | Appalachian Mountain-Grade Paving',
  },
  description: 'Top-rated asphalt paving contractor in Roanoke, Charlottesville & the Virginia Highlands. Skip the wait and get an instant AI Satellite Scan for your mountain, rural, or commercial project.',
  keywords: 'Asphalt Paving, Steep Driveways, Sealcoating, Blue Ridge Estate Paving, Rural Paving, Mountain-Grade Asphalt, Virginia Highlands',
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'DjBvZDUBT9eNyyLyNr9j61Sg4yqsXBdM10SrJes5u-Y',
  },
  openGraph: {
    title: 'Blue Ridge Estate Paving | Appalachian Mountain-Grade Paving',
    description: 'Top-rated asphalt paving contractor in Roanoke, Charlottesville & the Virginia Highlands.',
    url: 'https://www.blueridgeasphaltpaving.com',
    siteName: 'Blue Ridge Estate Paving',
    images: [
      {
        url: '/images/hero.png',
        width: 1200,
        height: 630,
        alt: 'Heavy Commercial Asphalt Paving Operation in Virginia',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blue Ridge Estate Paving | Appalachian Mountain-Grade Paving',
    description: 'Top-rated asphalt paving contractor in Roanoke, Charlottesville & the Virginia Highlands.',
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
        {/* Injecting Modern Premium Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <GeoSchema />
      </head>
      <body suppressHydrationWarning>
        {/* The Black & White Top Bar */}
        <div className="top-bar">
          <div>
            OPERATING FOR OVER 40 YEARS | INDEPENDENTLY OWNED
          </div>
          <div style={{ display: 'flex', gap: '30px' }}>
            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--estate-gold)" /> VIRGINIA HIGHLANDS</span>
            <a href="tel:8044461296" style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--estate-gold)', fontWeight: '600', textDecoration: 'none'}}><Phone size={16} /> (804) 446-1296</a>
          </div>
        </div>
        
        {/* The White & Red Navbar */}
        <nav className="navbar">
          <div className="logo">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
              BLUE RIDGE <span style={{ color: 'var(--powerhouse-red)' }}>ESTATE PAVING</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link href="/our-legacy" className="nav-link">Our Legacy</Link>
            <Link href="/commercial-paving" className="nav-link">Commercial</Link>
            <Link href="/residential-driveways" className="nav-link">Residential</Link>
            <Link href="/tar-and-chip" className="nav-link">Tar & Chip</Link>
            <Link href="/asphalt-milling" className="nav-link">Milling</Link>
            <Link href="/sealcoating-maintenance" className="nav-link">Maintenance</Link>
            <Link href="/insights" className="nav-link" style={{ color: 'var(--estate-gold)' }}>Insights</Link>
            <Link href="/#contact" className="btn-primary">Get a Quote</Link>
          </div>
        </nav>
        
        {children}
        
        {/* The Massive Carbon Black Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>Blue Ridge Estate Paving</h3>
              <p style={{color: '#aaa', fontSize: '1.1rem', fontWeight: '500', lineHeight: '1.8'}}>
                We provide superior mountain-grade asphalt solutions for commercial and residential properties across the Virginia Highlands. From steep rural driveways to massive commercial overlays, we engineer asphalt to survive the harsh Appalachian freeze-thaw cycles.
              </p>
              <div style={{ marginTop: '15px' }}>
                <a href="tel:8044461296" style={{color: '#fff', fontSize: '1rem', fontWeight: 'bold', display: 'block', textDecoration: 'none'}}><Phone size={14} style={{ display: 'inline', marginRight: '5px' }}/> (804) 446-1296</a>
                <p style={{color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginTop: '5px'}}>Email: j.wordenandsonspaving@gmail.com</p>
              </div>
            </div>
            <div className="footer-col">
              <h3>National-Grade Services</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><Link href="/commercial-paving" style={{ color: '#aaa', textDecoration: 'none' }}>Commercial Paving</Link></li>
                <li><Link href="/residential-driveways" style={{ color: '#aaa', textDecoration: 'none' }}>Steep Residential Driveways</Link></li>
                <li><Link href="/tar-and-chip" style={{ color: '#aaa', textDecoration: 'none' }}>Tar & Chip Paving</Link></li>
                <li><Link href="/sealcoating-maintenance" style={{ color: '#aaa', textDecoration: 'none' }}>Appalachian Sealcoating</Link></li>
                <li><Link href="/asphalt-milling" style={{ color: '#aaa', textDecoration: 'none' }}>Asphalt Milling</Link></li>
              </ul>
            </div>
            <div className="footer-col" style={{ flex: '2 1 400px' }}>
              <h3>Highland & Rural Service Areas</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                <li><Link href="/service/roanoke-va" style={{ color: '#aaa', textDecoration: 'none' }}>Roanoke, VA</Link></li>
                <li><Link href="/service/charlottesville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Charlottesville, VA</Link></li>
                <li><Link href="/service/winchester-va" style={{ color: '#aaa', textDecoration: 'none' }}>Winchester, VA</Link></li>
                <li><Link href="/service/monterey-va" style={{ color: '#aaa', textDecoration: 'none' }}>Monterey, VA</Link></li>
                <li><Link href="/service/staunton-va" style={{ color: '#aaa', textDecoration: 'none' }}>Staunton, VA</Link></li>
                <li><Link href="/service/harrisonburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Harrisonburg, VA</Link></li>
                <li><Link href="/service/lexington-va" style={{ color: '#aaa', textDecoration: 'none' }}>Lexington, VA</Link></li>
                <li><Link href="/service/waynesboro-va" style={{ color: '#aaa', textDecoration: 'none' }}>Waynesboro, VA</Link></li>
                <li><Link href="/service/hot-springs-va" style={{ color: '#aaa', textDecoration: 'none' }}>Hot Springs, VA</Link></li>
                <li><Link href="/service/warm-springs-va" style={{ color: '#aaa', textDecoration: 'none' }}>Warm Springs, VA</Link></li>
                <li><Link href="/service/clifton-forge-va" style={{ color: '#aaa', textDecoration: 'none' }}>Clifton Forge, VA</Link></li>
                <li><Link href="/service/covington-va" style={{ color: '#aaa', textDecoration: 'none' }}>Covington, VA</Link></li>
                <li><Link href="/service/luray-va" style={{ color: '#aaa', textDecoration: 'none' }}>Luray, VA</Link></li>
                <li><Link href="/service/front-royal-va" style={{ color: '#aaa', textDecoration: 'none' }}>Front Royal, VA</Link></li>
                <li><Link href="/service/buchanan-va" style={{ color: '#aaa', textDecoration: 'none' }}>Buchanan, VA</Link></li>
                <li><Link href="/service/fincastle-va" style={{ color: '#aaa', textDecoration: 'none' }}>Fincastle, VA</Link></li>
                <li><Link href="/service/crozet-va" style={{ color: '#aaa', textDecoration: 'none' }}>Crozet, VA</Link></li>
                <li><Link href="/service/new-market-va" style={{ color: '#aaa', textDecoration: 'none' }}>New Market, VA</Link></li>
                <li><Link href="/service/woodstock-va" style={{ color: '#aaa', textDecoration: 'none' }}>Woodstock, VA</Link></li>
                <li><Link href="/service/strasburg-va" style={{ color: '#aaa', textDecoration: 'none' }}>Strasburg, VA</Link></li>
                <li><Link href="/service/troutville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Troutville, VA</Link></li>
                <li><Link href="/service/natural-bridge-va" style={{ color: '#aaa', textDecoration: 'none' }}>Natural Bridge, VA</Link></li>
                <li><Link href="/service/goshen-va" style={{ color: '#aaa', textDecoration: 'none' }}>Goshen, VA</Link></li>
                <li><Link href="/service/craigsville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Craigsville, VA</Link></li>
                <li><Link href="/service/fairfield-va" style={{ color: '#aaa', textDecoration: 'none' }}>Fairfield, VA</Link></li>
                <li><Link href="/service/afton-va" style={{ color: '#aaa', textDecoration: 'none' }}>Afton, VA</Link></li>
                <li><Link href="/service/wintergreen-va" style={{ color: '#aaa', textDecoration: 'none' }}>Wintergreen, VA</Link></li>
                <li><Link href="/service/nellysford-va" style={{ color: '#aaa', textDecoration: 'none' }}>Nellysford, VA</Link></li>
                <li><Link href="/service/lovingston-va" style={{ color: '#aaa', textDecoration: 'none' }}>Lovingston, VA</Link></li>
                <li><Link href="/service/raphine-va" style={{ color: '#aaa', textDecoration: 'none' }}>Raphine, VA</Link></li>
                <li><Link href="/service/steeles-tavern-va" style={{ color: '#aaa', textDecoration: 'none' }}>Steeles Tavern, VA</Link></li>
                <li><Link href="/service/vesuvius-va" style={{ color: '#aaa', textDecoration: 'none' }}>Vesuvius, VA</Link></li>
                <li><Link href="/service/eagle-rock-va" style={{ color: '#aaa', textDecoration: 'none' }}>Eagle Rock, VA</Link></li>
                <li><Link href="/service/iron-gate-va" style={{ color: '#aaa', textDecoration: 'none' }}>Iron Gate, VA</Link></li>
                <li><Link href="/service/millboro-va" style={{ color: '#aaa', textDecoration: 'none' }}>Millboro, VA</Link></li>
                <li><Link href="/service/bolar-va" style={{ color: '#aaa', textDecoration: 'none' }}>Bolar, VA</Link></li>
                <li><Link href="/service/mcdowell-va" style={{ color: '#aaa', textDecoration: 'none' }}>McDowell, VA</Link></li>
                <li><Link href="/service/mustoe-va" style={{ color: '#aaa', textDecoration: 'none' }}>Mustoe, VA</Link></li>
                <li><Link href="/service/hightown-va" style={{ color: '#aaa', textDecoration: 'none' }}>Hightown, VA</Link></li>
                <li><Link href="/service/blue-grass-va" style={{ color: '#aaa', textDecoration: 'none' }}>Blue Grass, VA</Link></li>
                <li><Link href="/service/doe-hill-va" style={{ color: '#aaa', textDecoration: 'none' }}>Doe Hill, VA</Link></li>
                <li><Link href="/service/sugar-grove-va" style={{ color: '#aaa', textDecoration: 'none' }}>Sugar Grove, VA</Link></li>
                <li><Link href="/service/fort-defiance-va" style={{ color: '#aaa', textDecoration: 'none' }}>Fort Defiance, VA</Link></li>
                <li><Link href="/service/mount-sidney-va" style={{ color: '#aaa', textDecoration: 'none' }}>Mount Sidney, VA</Link></li>
                <li><Link href="/service/grottoes-va" style={{ color: '#aaa', textDecoration: 'none' }}>Grottoes, VA</Link></li>
                <li><Link href="/service/elkton-va" style={{ color: '#aaa', textDecoration: 'none' }}>Elkton, VA</Link></li>
                <li><Link href="/service/mcgaheysville-va" style={{ color: '#aaa', textDecoration: 'none' }}>McGaheysville, VA</Link></li>
                <li><Link href="/service/massanutten-va" style={{ color: '#aaa', textDecoration: 'none' }}>Massanutten, VA</Link></li>
                <li><Link href="/service/timberville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Timberville, VA</Link></li>
                <li><Link href="/service/broadway-va" style={{ color: '#aaa', textDecoration: 'none' }}>Broadway, VA</Link></li>
                <li><Link href="/service/highlands-va" style={{ color: 'var(--estate-gold)', textDecoration: 'none', fontWeight: 'bold' }}>Highlands, VA</Link></li>
                <li><Link href="/service/churchville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Churchville, VA</Link></li>
                <li><Link href="/service/williamsville-va" style={{ color: '#aaa', textDecoration: 'none' }}>Williamsville, VA</Link></li>
                <li><Link href="/service/swoope-va" style={{ color: '#aaa', textDecoration: 'none' }}>Swoope, VA</Link></li>
                <li><Link href="/service/deerfield-va" style={{ color: '#aaa', textDecoration: 'none' }}>Deerfield, VA</Link></li>
                <li><Link href="/service/middlebrook-va" style={{ color: '#aaa', textDecoration: 'none' }}>Middlebrook, VA</Link></li>
                <li><Link href="/service/mount-solon-va" style={{ color: '#aaa', textDecoration: 'none' }}>Mount Solon, VA</Link></li>
                <li><Link href="/service/franklin-wv" style={{ color: '#aaa', textDecoration: 'none' }}>Franklin, WV</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p>&copy; {new Date().getFullYear()} Blue Ridge Estate Paving. All rights reserved.</p>
            <p style={{ fontSize: '0.8rem', opacity: '0.6' }}>Blue Ridge Estate Paving is a division of J. Worden & Sons Paving LLC.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
