import { BLOG_POSTS } from '@/data/blogPosts';

/**
 * Blog post resolution for the static (no-backend) path.
 *
 * `src/data/blogPosts.js` holds 28 keyword-targeted articles averaging ~4,600
 * characters of markdown. Until now nothing imported it except
 * scripts/generate-sitemap.mjs, so all 28 slugs were advertised to Google while
 * /blog/:slug resolved none of them: the API returns no rows, the fallback list
 * below did not contain the slugs, and BlogPost.jsx rendered "Article Not
 * Found" — at HTTP 200, carrying the homepage <title> and a canonical pointing
 * at the homepage. Because scripts/prerender.mjs takes its route list from the
 * sitemap, that not-found page was baked into 28 static files.
 *
 * Merging the seed set in here fixes the article pages, the /blog index and the
 * related-posts rail from one place, since all three read FALLBACK_BLOG_POSTS.
 */

// blogPosts.js predates this shape and uses its own field names.
//
// public/work/portfolio holds portfolio-001.jpg .. portfolio-030.jpg. Keep this
// at the number of files that actually exist: the modulo below is what stops a
// 29th seed post from asking for portfolio-031.jpg, which would 404 as an
// og:image. If more portfolio images are added, raise this to match.
const COVER_POOL_SIZE = 30;

function normalizeSeedPost(post, index) {
  return {
    id: post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.body,
    category: post.category,
    published_date: post.date,
    updated_date: post.date,
    // "5 min" -> 5. parseInt stops at the space.
    read_time_minutes: parseInt(post.readTime, 10) || 5,
    author: 'J. Worden & Sons',
    // Spread covers across the portfolio set so 28 articles do not all share a
    // single og:image, which reads as boilerplate in social previews.
    cover_image: `/work/portfolio/portfolio-${String((index % COVER_POOL_SIZE) + 1).padStart(3, '0')}.jpg`,
    tags: [post.category],
    featured: Boolean(post.featured),
  };
}

const CURATED_POSTS = [  {
    id: 'richmond-virginia-asphalt-domination',
    slug: 'richmond-virginia-asphalt-domination',
    title: 'Dominating Central Virginia: Asphalt Paving in Richmond, Chesterfield & Fredericksburg',
    excerpt: 'At J. Worden, we provide the highest quality asphalt paving, driveway repair, and commercial parking lot solutions to dominate the local pack in Richmond, VA and surrounding communities.',
    content: '<h2>Leading Asphalt Services in Richmond, VA</h2><p>Our commitment to excellence makes us the top choice for residential and commercial asphalt paving across Richmond, Chesterfield, Fredericksburg, and the entire Virginia area.</p><ul><li>Driveway paving and overlays tailored for Virginia weather</li><li>Commercial sealcoating and ADA-compliant line striping</li><li>Pothole repair, milling, and base failure correction</li></ul><p>As the #1 trusted contractor, we ensure your investment lasts for decades. Contact us today for driveway paving, commercial asphalt, and fast, reliable local service.</p>',
    publishedAt: new Date().toISOString(),
    published_date: new Date().toISOString().split('T')[0],
    image: '/work/portfolio/portfolio-010.jpg',
    cover_image: '/work/portfolio/portfolio-010.jpg',
    readTime: '4 min'
  },
  {
    id: 'fallback-1',
    slug: 'asphalt-driveway-lifespan-virginia',
    title: 'How Long Does an Asphalt Driveway Last in Virginia?',
    excerpt:
      'Learn what controls driveway lifespan in Virginia and how drainage, traffic, and sealcoating intervals can add years of performance.',
    content: `## Quick Answer

A properly installed asphalt driveway in Virginia commonly lasts **15 to 25 years**. The biggest variables are base quality, water management, and maintenance consistency.

## What Shortens Driveway Life

- Standing water near edges or low spots
- Poor base compaction during installation
- Repeated heavy vehicle loading in one track
- Delayed crack sealing that allows water intrusion

## How To Add Years To Your Pavement

### 1. Sealcoat On Schedule
Most residential surfaces in Central Virginia do best with sealcoating roughly every **2 to 3 years**.

### 2. Fix Cracks Early
Small cracks are inexpensive to repair when caught early. Waiting allows water to reach the base.

### 3. Keep Drainage Open
Clean culverts and edge channels before storm season so runoff moves away from paved areas.

## When Replacement Makes More Sense

If there is widespread base movement or multiple failed repairs, full reconstruction is often the best long-term value compared to repeated patch cycles.
`,
    category: 'driveway-maintenance',
    published_date: '2026-04-10',
    updated_date: '2026-04-10',
    read_time_minutes: 5,
    author: 'J. Worden & Sons',
    cover_image: '/hero-paving.jpg',
    tags: ['driveway lifespan', 'virginia asphalt', 'sealcoating'],
  },
  {
    id: 'fallback-2',
    slug: 'sealcoating-schedule-central-virginia',
    title: 'Best Sealcoating Schedule for Central Virginia Properties',
    excerpt:
      'A practical sealcoating schedule for homes, commercial lots, and HOA roads based on traffic and climate conditions in Central Virginia.',
    content: `## Why Timing Matters

Sealcoating protects asphalt from UV oxidation, moisture penetration, and chemical wear. Timing should match traffic level and exposure.

## Typical Intervals

- **Residential driveways:** every 2-3 years
- **Commercial lots:** every 2 years in high-use lanes
- **HOA/private roads:** every 2-4 years depending on volume

## Before You Sealcoat

- Complete crack sealing first
- Address failed spots with patching
- Allow new asphalt to cure before first coat

## Planning Tip

Schedule work in dry weather windows and avoid periods with overnight freezing risk for the strongest cure quality.
`,
    category: 'sealcoating',
    published_date: '2026-03-22',
    updated_date: '2026-03-22',
    read_time_minutes: 4,
    author: 'J. Worden & Sons',
    cover_image: '/og-default.jpg',
    tags: ['sealcoating schedule', 'parking lot maintenance', 'central virginia'],
  },
  {
    id: 'fallback-3',
    slug: 'repair-vs-replace-parking-lot-guide',
    title: 'Parking Lot Repair vs Replacement: A Cost-Driven Guide',
    excerpt:
      'How to evaluate asphalt repair, overlay, or full replacement for commercial lots without overspending or delaying critical fixes.',
    content: `## Start With The Base Condition

If the base is stable and distress is mostly surface-level, targeted repairs or overlays can extend service life.

## Choose Repair When

- Distress is isolated to limited areas
- Drainage can be corrected without full rebuild
- Existing grades and ADA transitions remain compliant

## Choose Replacement When

- Alligator cracking is widespread
- Rutting and settlement repeat after patching
- Water intrusion has compromised the sub-base

## Ownership Perspective

The lowest upfront bid is not always the lowest lifecycle cost. Ask for a phased plan tied to expected service years.
`,
    category: 'commercial-paving',
    published_date: '2026-03-01',
    updated_date: '2026-03-01',
    read_time_minutes: 6,
    author: 'J. Worden & Sons',
    cover_image: '/hero-paving.jpg',
    tags: ['parking lot repair', 'asphalt replacement', 'commercial paving'],
  },
  {
    id: 'fallback-4',
    slug: 'freeze-thaw-damage-asphalt',
    title: 'How Freeze-Thaw Cycles Damage Asphalt and What To Do',
    excerpt:
      'Freeze-thaw weather can accelerate cracks and edge failure. Here is how to protect your pavement before and after winter.',
    content: `## The Freeze-Thaw Problem

Water enters small cracks, freezes, expands, and then contracts as temperatures change. Repeated cycles widen defects rapidly.

## High-Risk Areas

- Driveway edges without support
- Low spots that hold water
- Utility cuts and older patch seams

## Prevention Checklist

- Seal cracks before winter
- Correct low spots and ponding zones
- Keep drainage structures clear
- Schedule spring inspection for new movement

## Why Fast Response Matters

Early treatment prevents small failures from becoming full-depth repairs.
`,
    category: 'asphalt-care',
    published_date: '2026-02-18',
    updated_date: '2026-02-18',
    read_time_minutes: 4,
    author: 'J. Worden & Sons',
    cover_image: '/og-default.jpg',
    tags: ['freeze thaw', 'crack sealing', 'asphalt maintenance'],
  },
  {
    id: 'fallback-5',
    slug: 'hoa-roadway-maintenance-plan',
    title: 'Building a 3-Year HOA Roadway Maintenance Plan',
    excerpt:
      'A practical framework for HOA boards to budget paving, repairs, sealcoating, and striping without surprise failures.',
    content: `## Year 1: Baseline Assessment

Map defects by severity and prioritize safety-critical areas first. Establish clear photo documentation.

## Year 2: Structural Corrections

Complete base-sensitive repairs, drainage updates, and edge stabilization before surface treatments.

## Year 3: Preservation Focus

Apply sealcoating where appropriate, refresh striping, and schedule annual inspections.

## Board Communication Tip

Use phased scopes with clear outcomes so residents understand why each step happens in order.
`,
    category: 'hoa-paving',
    published_date: '2026-02-05',
    updated_date: '2026-02-05',
    read_time_minutes: 5,
    author: 'J. Worden & Sons',
    cover_image: '/hero-paving.jpg',
    tags: ['hoa roads', 'maintenance planning', 'asphalt budget'],
  },
];

const SEED_POSTS = BLOG_POSTS.map(normalizeSeedPost);

// Curated entries win on slug collision — they are hand-written and already
// carry real cover images and tags.
const CURATED_SLUGS = new Set(CURATED_POSTS.map((p) => p.slug));

export const FALLBACK_BLOG_POSTS = [
  ...CURATED_POSTS,
  ...SEED_POSTS.filter((p) => !CURATED_SLUGS.has(p.slug)),
].sort((a, b) => String(b.published_date || '').localeCompare(String(a.published_date || '')));

export function getFallbackBlogPostBySlug(slug) {
  return FALLBACK_BLOG_POSTS.find((p) => p.slug === slug) || null;
}
