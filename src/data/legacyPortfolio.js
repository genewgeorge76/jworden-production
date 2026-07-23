/**
 * J. Worden & Sons — Portfolio Data
 *
 * THREE tiers:
 *  portfolioPhotos       — 30 real job photos (resized, EXIF-corrected, from archives)
 *  kfcPhotos             — 120 KFC national-program photos (lazy/paginated in gallery)
 *  featuredPortfolioPhotos — 8 hero shots for Home / service page SmartImage refs
 *
 * Each portfolioPhoto has:
 *   category:      'Residential' | 'Commercial' | 'Maintenance' | 'Hardscapes'
 *   locationGroup: city used for gallery grouping + SEO
 *   phase:         'during' | 'completed'
 *   featured:      true → shown on main pages, false → gallery only
 */

// ── Real portfolio photos — grouped by state ──────────────────────────────────
import importedData from './project-import.json';

// ── Real portfolio photos — generated from local ingest ────────────────────────
export const portfolioPhotos = importedData.map((item, i) => {
  // Try to parse a nice title from the filename if possible, otherwise use the date title
  let cleanTitle = item.title;
  const match = item.image_url.match(/_local_(.*)\.(jpg|png|webp)/i);
  if (match) {
    cleanTitle = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return {
    id: `port-imp-${i}`,
    url: item.image_url.replace('/public/', '/'),
    title: cleanTitle,
    category: cleanTitle.toLowerCase().includes('cvs') || cleanTitle.toLowerCase().includes('walgreens') ? 'Commercial' : 'Residential',
    locationGroup: item.location === 'unknown-location' ? 'Virginia' : item.location.charAt(0).toUpperCase() + item.location.slice(1),
    location: item.location === 'unknown-location' ? 'Virginia' : item.location.charAt(0).toUpperCase() + item.location.slice(1),
    phase: 'completed',
    featured: i < 8,
    description: 'J. Worden & Sons real project photo.',
  };
});

// ── 8 hero shots for main pages ───────────────────────────────────────────────
export const featuredPortfolioPhotos = portfolioPhotos.filter(p => p.featured);

// ── Combined export (Gallery.jsx + other pages import this) ──────────────────
export const legacyPortfolioImages = [
  ...portfolioPhotos,
];

export const portfolioCategories = [
  'All',
  'Residential',
  'Commercial',
  'Maintenance',
  'Hardscapes',
];
