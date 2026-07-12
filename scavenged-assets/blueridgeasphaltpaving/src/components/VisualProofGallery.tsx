import React from 'react';
import Image from 'next/image';

const portfolioImages = [
  {
    url: '/images/machinery.png',
    alt: 'Heavy Commercial Asphalt Paving Operation in Virginia',
    caption: 'Commercial Hot Mix Asphalt (HMA) Overlay'
  },
  {
    url: '/images/milling.png',
    alt: 'Laser Guided Grading and Subgrade Preparation',
    caption: 'Subgrade Compaction & Laser Grading'
  },
  {
    url: '/images/hero.png',
    alt: 'Industrial Roller Compacting Fresh Asphalt',
    caption: 'Vibratory Roller Compaction (95%+ Density)'
  },
  {
    url: '/images/sealcoating.png',
    alt: 'Freshly Striped Commercial Parking Lot',
    caption: 'ADA Compliant Line Striping & Sealcoating'
  }
];

export default function VisualProofGallery() {
  return (
    <section style={{ padding: '80px 40px', background: 'var(--bg-primary)', color: 'white' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '10px', color: 'var(--estate-gold)' }}>Visual Proof of Execution</h2>
        <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '40px', maxWidth: '800px' }}>
          We don&apos;t just talk about engineering excellence; we document it. View our heavy fleet in action across commercial and residential deployments in the Virginia market.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {portfolioImages.map((img, index) => (
            <div key={index} className="gallery-card">
              <div style={{ position: 'relative', width: '100%', height: '250px' }}>
                <Image 
                  src={img.url} 
                  alt={img.alt} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
              <p style={{ marginTop: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>{img.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
