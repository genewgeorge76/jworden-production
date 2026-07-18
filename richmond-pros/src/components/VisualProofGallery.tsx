import React from 'react';
import { portfolioPhotos } from '@/lib/legacyPortfolio';

// Use actual completed job photos from your archives
const portfolioImages = portfolioPhotos.slice(0, 8).map((photo) => ({
  url: photo.url,
  alt: photo.title,
  caption: photo.description || photo.title,
}));

export default function VisualProofGallery() {
  return (
    <section style={{ padding: '80px 40px', background: 'var(--carbon-black)', color: 'white' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '10px', color: 'var(--powerhouse-red)' }}>Visual Proof of Execution</h2>
        <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '40px', maxWidth: '800px' }}>
          We don&apos;t just talk about engineering excellence; we document it. View our heavy fleet in action across commercial and residential deployments in the Virginia market.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {portfolioImages.map((img, index) => (
            <div key={index} className="group" style={{ position: 'relative', height: '300px', overflow: 'hidden', borderRadius: '8px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
