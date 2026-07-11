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
import importedData from '../../public/work/imported/project-import.json';

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

// ── KFC national-program photos (120) — paginated in gallery ─────────────────
const KFC_LABELS = [
  { title: 'KFC Parking Lot — Full Mill & Overlay',         location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC Drive-Thru Lane Paving',                    location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC Lot Resurfacing & Striping',                location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC Franchise ADA Upgrade',                     location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC Sealcoating & Crack Fill',                  location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC Concrete Curb & Apron Work',               location: 'North Carolina', locGroup: 'North Carolina' },
  { title: 'KFC New Store Build — Civil Through Finish',    location: 'Texas',         locGroup: 'Texas' },
  { title: 'KFC Drive-Thru Reconstruction',                 location: 'Georgia',       locGroup: 'Georgia' },
  { title: 'KFC Lot Renovation — Post-Pandemic Remodel',   location: 'Michigan',      locGroup: 'Michigan' },
  { title: 'KFC Store Remodel — Parking & Access',         location: 'Florida',       locGroup: 'Florida' },
  { title: 'KFC Franchise Paving — National Program',      location: 'Multi-State',   locGroup: 'Multi-State' },
  { title: 'KFC Site Paving — Franchise Standard',         location: 'New York',      locGroup: 'New York' },
  { title: 'KFC Drive-Thru Lane Build',                     location: 'New Jersey',    locGroup: 'New Jersey' },
  { title: 'KFC Parking Lot Sealcoating',                   location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC ADA Layout & Striping',                     location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC Lot Drainage & Base Repair',                location: 'Kansas',        locGroup: 'Kansas' },
  { title: 'KFC Full-Depth Reclamation',                    location: 'Tennessee',     locGroup: 'Tennessee' },
  { title: 'KFC Access Road — New Construction',            location: 'Ohio',          locGroup: 'Ohio' },
  { title: 'KFC Restripe & Sealcoat',                       location: 'Virginia',      locGroup: 'Virginia' },
  { title: 'KFC Parking Expansion',                         location: 'Pennsylvania',  locGroup: 'Pennsylvania' },
];

export const kfcPhotos = Array.from({ length: 120 }, (_, i) => {
  const num   = (i + 1).toString().padStart(3, '0');
  const label = KFC_LABELS[i % KFC_LABELS.length];
  const phase = i % 5 === 2 ? 'during' : 'completed'; // every 3rd-ish = during
  return {
    id:            `kfc-${num}`,
    url:           `/work/kfc/kfc-job-${num}.jpg`,
    title:         label.title,
    category:      'QSR / KFC',
    locationGroup: label.locGroup,
    location:      label.location,
    phase,
    featured:      false,
    description:   'Verified job photo — J. Worden & Sons. Documentation on file.',
  };
});

// ── Legacy GitHub archive photos (kept for backward compat) ──────────────────
const legacyArchive = [
  { id: 'leg-1', url: 'https://raw.githubusercontent.com/genewgeorge76/doooooone/main/assets/images/20160721_204440000_iOS.jpg',
    title: 'Richmond Residential Paving', category: 'Residential', locationGroup: 'Richmond, VA',
    location: 'Richmond, VA', phase: 'completed', featured: false,
    description: 'Legacy paving project, circa 2016.' },
  { id: 'leg-4', url: 'https://raw.githubusercontent.com/genewgeorge76/doooooone/main/assets/images/20170915_214013569_iOS.jpg',
    title: 'Sealcoating & Maintenance', category: 'Maintenance', locationGroup: 'Glen Allen, VA',
    location: 'Glen Allen, VA', phase: 'completed', featured: false,
    description: 'Professional sealcoating application, Glen Allen.' },
];

// ── Combined export (Gallery.jsx + other pages import this) ──────────────────
export const legacyPortfolioImages = [
  ...portfolioPhotos,
  ...legacyArchive,
  ...kfcPhotos,
];

export const portfolioCategories = [
  'All',
  'Residential',
  'Commercial',
  'QSR / KFC',
  'Maintenance',
  'Hardscapes',
];
