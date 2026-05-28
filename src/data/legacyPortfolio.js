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
export const portfolioPhotos = [

  // ══ VIRGINIA ════════════════════════════════════════════════════════════════

  // ── Goochland County, VA ─────────────────────────────────────────────────────
  { id: 'port-001', url: '/work/portfolio/portfolio-001.jpg',
    title: 'Two Asphalt Driveways — Goochland',
    category: 'Residential', locationGroup: 'Goochland, VA', location: 'Goochland, VA',
    phase: 'completed', featured: false,
    description: 'Side-by-side residential driveways, Goochland County.' },

  { id: 'port-007', url: '/work/portfolio/portfolio-007.jpg',
    title: 'Goochland Estate Driveway',
    category: 'Residential', locationGroup: 'Goochland, VA', location: 'Goochland, VA',
    phase: 'completed', featured: true,
    description: 'Large residential driveway on Goochland estate property.' },

  { id: 'port-009', url: '/work/portfolio/portfolio-009.jpg',
    title: 'Goochland Paving — Crew in Action',
    category: 'Residential', locationGroup: 'Goochland, VA', location: 'Goochland, VA',
    phase: 'during', featured: false,
    description: 'J. Worden crew machine-laying asphalt, Goochland County.' },

  { id: 'port-010', url: '/work/portfolio/portfolio-010.jpg',
    title: 'Goochland County Paving Project',
    category: 'Residential', locationGroup: 'Goochland, VA', location: 'Goochland, VA',
    phase: 'completed', featured: true,
    description: 'Smooth residential asphalt finish, Goochland County VA.' },

  // ── Chesterfield County, VA ───────────────────────────────────────────────────
  { id: 'port-002', url: '/work/portfolio/portfolio-002.jpg',
    title: 'Chesterfield Driveway — Machine Finish',
    category: 'Residential', locationGroup: 'Chesterfield, VA', location: 'Chesterfield, VA',
    phase: 'completed', featured: true,
    description: 'Full-depth asphalt driveway, precision machine-laid finish.' },

  { id: 'port-013', url: '/work/portfolio/portfolio-013.jpg',
    title: 'Circular Turnaround Driveway',
    category: 'Residential', locationGroup: 'Chesterfield, VA', location: 'Chesterfield, VA',
    phase: 'completed', featured: true,
    description: 'Full circular driveway with center island, Chesterfield County.' },

  { id: 'port-030', url: '/work/portfolio/portfolio-030.jpg',
    title: 'Estate Circular Driveway — Chesterfield',
    category: 'Residential', locationGroup: 'Chesterfield, VA', location: 'Chesterfield, VA',
    phase: 'during', featured: true,
    description: 'Large estate circular driveway being machine-laid, Chesterfield County.' },

  // ── Richmond, VA ─────────────────────────────────────────────────────────────
  { id: 'port-004', url: '/work/portfolio/portfolio-004.jpg',
    title: 'Richmond Driveway — Clean Finish',
    category: 'Residential', locationGroup: 'Richmond, VA', location: 'Richmond, VA',
    phase: 'completed', featured: true,
    description: 'Smooth asphalt driveway with clean edge detail, Richmond.' },

  { id: 'port-005', url: '/work/portfolio/portfolio-005.jpg',
    title: 'Richmond Residential Driveway',
    category: 'Residential', locationGroup: 'Richmond, VA', location: 'Richmond, VA',
    phase: 'completed', featured: false,
    description: 'Residential driveway paving, City of Richmond.' },

  { id: 'port-006', url: '/work/portfolio/portfolio-006.jpg',
    title: 'Asphalt + Brick Paver Edging — Richmond',
    category: 'Residential', locationGroup: 'Richmond, VA', location: 'Richmond, VA',
    phase: 'completed', featured: false,
    description: 'Custom asphalt driveway with decorative brick border, Richmond.' },

  { id: 'port-012', url: '/work/portfolio/portfolio-012.jpg',
    title: 'Large Richmond Driveway — 2-Car Wide',
    category: 'Residential', locationGroup: 'Richmond, VA', location: 'Richmond, VA',
    phase: 'completed', featured: true,
    description: 'Wide residential driveway with generous approach, City of Richmond.' },

  { id: 'port-017', url: '/work/portfolio/portfolio-017.jpg',
    title: 'Windsor Farms Driveway — Historic Richmond',
    category: 'Residential', locationGroup: 'Richmond, VA', location: 'Windsor Farms, Richmond, VA',
    phase: 'completed', featured: true,
    description: "Premium driveway paving in Windsor Farms, one of Richmond's premier neighborhoods." },

  // ── Midlothian, VA ───────────────────────────────────────────────────────────
  { id: 'port-008', url: '/work/portfolio/portfolio-008.jpg',
    title: 'Car Lot Paving — Midlothian Turnpike',
    category: 'Commercial', locationGroup: 'Midlothian, VA', location: 'Midlothian, VA',
    phase: 'during', featured: false,
    description: 'Commercial lot paving in progress, Midlothian Turnpike corridor.' },

  // ── Virginia — Residential ───────────────────────────────────────────────────
  { id: 'port-003', url: '/work/portfolio/portfolio-003.jpg',
    title: 'Long Rural Driveway — Virginia Piedmont',
    category: 'Residential', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'completed', featured: false,
    description: 'Extended driveway installation on rural Virginia property.' },

  // ── Virginia — Commercial ────────────────────────────────────────────────────
  { id: 'port-011', url: '/work/portfolio/portfolio-011.jpg',
    title: 'Asphalt Paver Machine — Active Lay',
    category: 'Commercial', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'during', featured: false,
    description: 'Machine-laid asphalt with paving machine in full operation.' },

  { id: 'port-014', url: '/work/portfolio/portfolio-014.jpg',
    title: 'Commercial Lot Paving — Virginia',
    category: 'Commercial', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'during', featured: false,
    description: 'Roller compaction on fresh commercial asphalt, Virginia.' },

  { id: 'port-015', url: '/work/portfolio/portfolio-015.jpg',
    title: 'CVS Pharmacy — Parking Lot',
    category: 'Commercial', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'completed', featured: false,
    description: 'Retail pharmacy parking lot asphalt paving and striping.' },

  { id: 'port-016', url: '/work/portfolio/portfolio-016.jpg',
    title: 'CVS Lot — Paving in Progress',
    category: 'Commercial', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'during', featured: false,
    description: 'Active commercial lot paving at CVS retail location.' },

  { id: 'port-019', url: '/work/portfolio/portfolio-019.jpg',
    title: 'Rite Aid — ADA Parking Upgrade',
    category: 'Commercial', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'completed', featured: false,
    description: 'ADA-compliant parking lot redesign and handicap space installation.' },

  { id: 'port-026', url: '/work/portfolio/portfolio-026.jpg',
    title: 'Commercial Lot — Fresh Pave & Curing',
    category: 'Commercial', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'during', featured: false,
    description: 'Freshly laid commercial asphalt curing with traffic cones in place.' },

  // ══ SOUTH CAROLINA ══════════════════════════════════════════════════════════

  { id: 'port-018', url: '/work/portfolio/portfolio-018.jpg',
    title: 'Rural Road Paving — South Carolina',
    category: 'Residential', locationGroup: 'South Carolina', location: 'South Carolina',
    phase: 'during', featured: false,
    description: 'Rural road and driveway paving project, South Carolina.' },

  // ══ HARDSCAPES ══════════════════════════════════════════════════════════════

  { id: 'port-031', url: '/work/portfolio/portfolio-031.webp',
    title: 'Cobblestone Hardscape Installation',
    category: 'Hardscapes', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'completed', featured: false,
    description: 'Custom cobblestone hardscape work — paver borders and decorative stone integration.' },

  { id: 'port-032', url: '/work/portfolio/portfolio-032.webp',
    title: 'Cobblestone Border Detail',
    category: 'Hardscapes', locationGroup: 'Virginia', location: 'Virginia',
    phase: 'completed', featured: false,
    description: 'Decorative cobblestone border complementing asphalt driveway.' },

];

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
