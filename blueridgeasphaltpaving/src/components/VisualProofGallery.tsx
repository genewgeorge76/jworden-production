import React from 'react';

const portfolioImages = [
  {
    url: 'https://images.unsplash.com/photo-1590495945196-85dc3c983ce6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    alt: 'Heavy Commercial Asphalt Paving Operation in Virginia',
    caption: 'Commercial Hot Mix Asphalt (HMA) Overlay'
  },
  {
    url: 'https://images.unsplash.com/photo-1621570169123-2895513ab455?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    alt: 'Laser Guided Grading and Subgrade Preparation',
    caption: 'Subgrade Compaction & Laser Grading'
  },
  {
    url: 'https://images.unsplash.com/photo-1541888054942-0f04c633a69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    alt: 'Industrial Roller Compacting Fresh Asphalt',
    caption: 'Vibratory Roller Compaction (95%+ Density)'
  },
  {
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    alt: 'Freshly Striped Commercial Parking Lot',
    caption: 'ADA Compliant Line Striping & Sealcoating'
  }
];

export default function VisualProofGallery() {
  return (
    <section style={{ padding: '80px 40px', background: 'var(--carbon-black)', color: 'white' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '10px', color: 'var(--powerhouse-red)' }}>Visual Proof of Execution</h2>
        <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '40px', maxWidth: '800px' }}>
          We don't just talk about engineering excellence; we document it. View our heavy fleet in action across commercial and residential deployments in the Virginia market.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {portfolioImages.map((img, index) => (
            <div key={index} className="group" style={{ position: 'relative', height: '300px', overflow: 'hidden', borderRadius: '8px' }}>
              <img 
                src={img.url} 
                alt={img.alt} 
                style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }} 
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', padding: '15px' }}>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{img.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
