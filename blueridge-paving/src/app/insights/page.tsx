import { getSortedInsightsData } from '@/lib/insights'
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Engineering Insights & Case Studies | Blue Ridge Estate Paving',
  description: 'Technical breakdowns, case studies, and engineering insights from Virginia\'s premier commercial paving contractor.',
}

export default function InsightsPage() {
  const allInsightsData = getSortedInsightsData()
  
  if (!allInsightsData || allInsightsData.length === 0) {
    return <main><div style={{ padding: '100px', textAlign: 'center' }}>No insights available.</div></main>
  }

  const featuredInsight = allInsightsData[0]
  const remainingInsights = allInsightsData.slice(1)

  return (
    <main>
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <Image 
          src="https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Highland Paving Engineering"
          fill
          priority
          style={{ objectFit: 'cover', zIndex: 0 }}
        />
        <div className="hero-overlay" style={{ zIndex: 1, position: 'absolute', inset: 0 }}></div>
        <div className="hero-content" style={{ zIndex: 2, position: 'relative' }}>
          <h1>Engineering <span>Insights</span></h1>
          <p>Technical Case Studies and Paving Logistics from the Field.</p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto', background: 'var(--bg-primary)' }}>
        
        {/* Featured Insight */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--estate-gold)', marginBottom: '30px', letterSpacing: '2px', textTransform: 'uppercase' }}>Featured Case Study</h2>
          <a href={`/insights/${featuredInsight.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.3s ease', border: '1px solid var(--border-light)' }}>
              <div style={{ flex: '1 1 50%', position: 'relative', minHeight: '400px' }}>
                <Image 
                  src={featuredInsight.coverImage} 
                  alt={featuredInsight.title} 
                  fill 
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <div style={{ flex: '1 1 50%', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ color: 'var(--powerhouse-red)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '15px', letterSpacing: '1px' }}>
                  {new Date(featuredInsight.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <h3 style={{ fontSize: '2.5rem', marginBottom: '20px', lineHeight: '1.2', color: 'var(--pure-white)' }}>{featuredInsight.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.2rem', marginBottom: '30px' }}>{featuredInsight.description}</p>
                <div style={{ display: 'inline-block', fontWeight: 'bold', borderBottom: '2px solid var(--powerhouse-red)', color: 'var(--pure-white)', alignSelf: 'flex-start', paddingBottom: '5px' }}>
                  Read Full Technical Report
                </div>
              </div>
            </div>
          </a>
        </div>

        {/* Remaining Insights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '40px' }}>
          {remainingInsights.map(({ slug, date, title, description, coverImage, author }) => (
            <a href={`/insights/${slug}`} key={slug} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', transition: 'all 0.3s ease' }} className="insight-card">
                <div style={{ height: '250px', width: '100%', position: 'relative' }}>
                  <Image 
                    src={coverImage} 
                    alt={title} 
                    fill 
                    style={{ objectFit: 'cover' }} 
                  />
                </div>
                <div style={{ padding: '30px' }}>
                  <p style={{ color: 'var(--powerhouse-red)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>
                    {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', lineHeight: '1.3', color: 'var(--pure-white)' }}>{title}</h2>
                  {author && <p style={{ fontSize: '0.9rem', color: 'var(--estate-gold)', marginBottom: '15px', fontWeight: 'bold', letterSpacing: '1px' }}>AUTHOR: {author}</p>}
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{description}</p>
                  <div style={{ marginTop: '20px', display: 'inline-block', fontWeight: 'bold', color: 'var(--pure-white)', borderBottom: '1px solid var(--estate-gold)' }}>View Details</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
      
      <style>{`
        .insight-card:hover, .glass-panel:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border-color: var(--estate-gold);
        }
      `}</style>
    </main>
  )
}
