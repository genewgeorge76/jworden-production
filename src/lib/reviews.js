/**
 * reviews.js — Single source of truth for real, verified review data.
 *
 * Every rating and review count on the site — JSON-LD schema AND the visible
 * numbers on pages, cards, and the service-area map — derives from
 * REVIEW_PLATFORMS below. Counts come from the company's real public profiles.
 *
 * To update: change a platform's numbers here, or add a new platform entry
 * (e.g. Google once the Business Profile is reverified). The blended total and
 * every place that displays it stay consistent automatically — no drift.
 */
export const REVIEW_PLATFORMS = [
  {
    name: 'Google',
    rating: 4.4,
    count: 7,
    url: 'https://search.google.com/local/reviews?placeid=ChIJG3X8o_OStokRzRynNBuVfQ0',
    accent: 'Google Business Profile',
  },
  {
    name: 'Houzz',
    rating: 4.8,
    count: 12,
    url: 'https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484',
    accent: '4× Best of Houzz Service',
  },
  {
    name: 'Angi',
    rating: 4.5,
    count: 15,
    url: 'https://www.angi.com/companylist/us/va/chester/j-worden-and-sons-paving-reviews-7601083.htm',
    accent: 'Verified Pro',
  },
  {
    name: 'Facebook',
    // Facebook uses "% recommend", not stars: 86% recommend across 39 reviews.
    // Folded into the blended star average as its 5-point equivalent (0.86 × 5 ≈ 4.3).
    rating: 4.3,
    recommendPercent: 86,
    count: 40,
    url: 'https://www.facebook.com/jwordenpaving/',
    accent: '86% recommend',
  },
]

// Honest blended aggregate across every platform — weighted by count, no inflation.
export const REVIEW_COUNT = REVIEW_PLATFORMS.reduce((sum, p) => sum + p.count, 0)
export const REVIEW_RATING = Number(
  (REVIEW_PLATFORMS.reduce((sum, p) => sum + p.rating * p.count, 0) / REVIEW_COUNT).toFixed(1),
)

// Schema.org AggregateRating shape — must match the review numbers shown on-page.
export const AGGREGATE_RATING = {
  ratingValue: String(REVIEW_RATING),
  bestRating:  '5',
  worstRating: '1',
  reviewCount: String(REVIEW_COUNT),
}

// Real, verified customer reviews from the company's public Houzz profile.
// Used as the honest fallback on /reviews when the live Google API is offline,
// and anywhere featured reviews are shown. Only add entries that exist on a
// real public profile — never invented testimonials.
export const FEATURED_REVIEWS = [
  {
    author: 'Greg Orlick',
    rating: 5,
    date: '2022-04-19',
    source: 'Houzz',
    text: 'They paved our driveway 18 months ago with paver entries. Did a fabulous job. We ran into drainage issues, not their fault — they were great at fixing them and everything went as agreed. I would recommend them to everyone.',
  },
  {
    author: 'jaclynforrester',
    rating: 5,
    date: '2016-06-23',
    source: 'Houzz',
    text: "We had a major drainage issue in a brand new pea gravel driveway — a pond and sometimes an ice skating rink on one side. In 4 days the driveway was done. It's beautiful, it drains perfectly, and Gene's communication and his team's professionalism were excellent.",
  },
  {
    author: 'daryllhall',
    rating: 5,
    date: '2015-03-30',
    source: 'Houzz',
    text: 'J. Worden & Sons did a great job on our new driveway. Gene was friendly, courteous and provided excellent customer service. His crew even went above and beyond by moving and staging a supply of wood materials we had temporarily stored on our old driveway.',
  },
  {
    author: 'Susan Armentrout',
    rating: 5,
    date: '2013-11-09',
    source: 'Houzz',
    text: 'We hired J. Worden & Sons to repair and repave our large asphalt driveway. Friendly, professional and efficient crew with all the best machinery. We are very happy with the result.',
  },
]
