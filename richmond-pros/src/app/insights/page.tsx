import { getSortedInsightsData } from '@/lib/insights'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Engineering Insights & Case Studies | J. Worden Paving',
  description: 'Technical breakdowns, case studies, and engineering insights from Virginia\'s premier commercial paving contractor.',
}

export default function InsightsPage() {
  const allInsightsData = getSortedInsightsData()

  return (
    <main>
      <section className="subpage-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Engineering <span>Insights</span></h1>
          <p>Technical Case Studies and Paving Logistics from the Field.</p>
        </div>
      </section>

      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '40px' }}>
          {allInsightsData.map(({ slug, date, title, description, coverImage }) => (
            <a href={`/insights/${slug}`} key={slug} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'transform 0.3s ease' }} className="insight-card">
                <div style={{ height: '250px', width: '100%', position: 'relative' }}>
                  <img src={coverImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '30px' }}>
                  <p style={{ color: 'var(--powerhouse-red)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', lineHeight: '1.3' }}>{title}</h2>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{description}</p>
                  <div style={{ marginTop: '20px', display: 'inline-block', fontWeight: 'bold', borderBottom: '2px solid var(--powerhouse-red)' }}>Read Case Study</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
      
      <style>{`
        .insight-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </main>
  )
}
