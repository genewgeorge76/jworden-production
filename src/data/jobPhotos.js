/**
 * jobPhotos — the single registry of the company's own job photography.
 *
 * RULES, LEARNED THE HARD WAY TONIGHT:
 *  - Every entry is a photograph from the company's own cameras, viewed by a
 *    human-or-agent eye before listing. Nothing here is stock.
 *  - PERMANENTLY EXCLUDED, never add them back: portfolio-021..024 and the
 *    houzz-project-* files (furniture-store stock ads that were hiding in the
 *    folders), anything named download* (KFC marketing images, not our
 *    camera), Gemini_Generated_* (AI image — banned as proof), logos, QR
 *    codes, and *-w220-* thumbnails (too small to serve).
 *  - alts describe WHAT IS IN FRAME. No invented locations: a photo is only
 *    captioned with a place when the place is verifiable in-frame (a signed
 *    storefront) or documented. Minnesota frames carry market: 'MN' so no
 *    Virginia page presents them as local.
 *  - categories: residential | commercial | kfc | sealcoat | equipment |
 *    construction | hardscape
 */

const P = (src, alt, category, opts = {}) => ({ src, alt, category, market: 'VA', ...opts })

export const JOB_PHOTOS = [
  // ── Commercial ────────────────────────────────────────────────────────────
  P('/images/real_jobs/IMG_0026.webp', 'Grocery-anchor lot freshly sealcoated and striped, crew sweeping the entrance', 'commercial'),
  P('/images/real_jobs/IMG_0029.webp', 'Crisp new stripes on jet-black sealcoat at a grocery-anchor lot', 'commercial'),
  P('/images/real_jobs/IMG_8715-PANO.webp', 'Paver and rollers working a dealership lot, business open behind the cones', 'commercial'),
  P('/images/real_jobs/PARKING LOT PAVE RICHMOND VA.JPG', 'Fresh black mat across a Richmond parking lot', 'commercial'),
  P('/images/real_jobs/petsmart-ashley-center-patch.webp', 'Repaired lane at a PetSmart and Ashley retail center', 'commercial'),
  P('/images/real_jobs/burlington-market-center-paving.webp', 'Paver and dump truck working a shopping-center lot', 'commercial'),
  P('/images/real_jobs/retail-lot-repave-fresh-mat.webp', 'Fresh mat across a retail lot, dump truck staged', 'commercial'),
  P('/images/real_jobs/office-lot-fresh-sealcoat.webp', 'Office lot freshly sealed, measuring wheel still out', 'sealcoat'),
  P('/images/real_jobs/sealcoat-lane-f750-rig.webp', 'Freshly sealed lane with the dump truck and spray rig on site', 'sealcoat'),
  P('/images/real_jobs/brick-alley-repave-taped.webp', 'Repaved lane between brick buildings, still taped off', 'commercial'),
  P('/images/real_jobs/bobcat-road-patch-richmond.webp', 'Tracked loader and cones set for a road patch', 'equipment'),
  P('/images/real_jobs/roadway-crew-paving.webp', 'Full crew paving a roadway, curb and gutter in', 'construction'),
  P('/images/real_jobs/subdivision-street-overlay.webp', 'Crew overlaying a subdivision street', 'construction'),
  P('/images/real_jobs/industrial-newbuild-lane.webp', 'New paving lane along curb at an industrial site', 'construction'),
  P('/images/real_jobs/commercial-newbuild-first-lift-2025.webp', 'Crew in hi-vis laying first lift against compacted stone at a new commercial building', 'construction'),
  P('/images/real_jobs/HANDICAP UPGRADE WALGREENS.JPG', 'Accessible-parking upgrade with fresh striping at a Walgreens', 'commercial'),

  // ── Residential ───────────────────────────────────────────────────────────
  P('/images/real_jobs/IMG_6981.webp', 'Crew and paver laying hot mix on an estate driveway with cobblestone borders', 'residential'),
  P('/images/real_jobs/estate-gate-2012.webp', 'Fresh asphalt drive through a stone-pillar gated entrance', 'residential'),
  P('/images/real_jobs/winter-driveway-repave-2014.webp', 'Roller finishing a wooded residential drive in winter', 'residential'),
  P('/images/real_jobs/roller-driveway-brick-colonial-2014.jpg', 'Crew member rolling a long driveway at a brick colonial', 'residential'),
  P('/images/real_jobs/sealcoated-curved-driveway.webp', 'Freshly sealcoated curved driveway between manicured lawns', 'sealcoat'),
  P('/images/real_jobs/brick-ranch-driveway-planters.webp', 'Fresh asphalt drive along brick planter walls at a ranch home', 'residential'),
  P('/images/real_jobs/curved-driveway-cobble-edge.webp', 'Curved driveway with cobblestone edging along a picket fence', 'residential'),
  P('/images/real_jobs/driveway-cobblestone-ribbon.webp', 'Driveway with a cobblestone center ribbon between two homes', 'residential'),
  P('/images/real_jobs/garage-driveway-extension.webp', 'New driveway extension to a detached two-bay garage', 'residential'),
  P('/images/real_jobs/new-road-build.webp', 'New road build on compacted stone base through pines', 'construction'),
  P('/images/real_jobs/hero-driveway-minnesota.webp', 'Long driveway freshly paved beside a tree line', 'residential', { market: 'MN' }),
  P('/images/real_jobs/minnesota-farm-driveway-paving.jpg', 'Farm driveway paved to the barn', 'residential', { market: 'MN' }),
  P('/images/real_jobs/minnesota-lake-cabin-sealcoating-after.jpg', 'Lake-cabin drive after sealcoating', 'sealcoat', { market: 'MN' }),
  P('/images/real_jobs/minnesota-lake-driveway-sealcoating.jpg', 'Lakeside driveway during sealcoating', 'sealcoat', { market: 'MN' }),
  P('/images/real_jobs/minnesota-crack-filling-repair.jpg', 'Crack filling in progress on a Minnesota drive', 'sealcoat', { market: 'MN' }),
  P('/images/real_jobs/minnesota-paving-project-1.jpg', 'Residential paving project in progress', 'residential', { market: 'MN' }),
  P('/images/real_jobs/minnesota-paving-project-2.jpg', 'Fresh mat rolled on a residential project', 'residential', { market: 'MN' }),

  // ── Equipment & process ───────────────────────────────────────────────────
  P('/images/real_jobs/leeboy-8515-being-fed.webp', 'LeeBoy 8515 paver taking mix from the dump truck', 'equipment'),
  P('/images/real_jobs/skid-steer-feeding-hand-crew.webp', 'Skid steer feeding hot mix to the hand crew', 'equipment'),
  P('/images/real_jobs/IMG_0022.webp', 'Crack seal going down after close at a shopping center', 'sealcoat'),
  P('/images/real_jobs/flagstone-walkway-stacked-steps-2013.webp', 'Flagstone walkway with dry-stacked stone steps', 'hardscape'),

  // ── KFC national programme (all frames from our crews on franchise lots) ──
  P('/images/real_jobs/kfc-crew-luting-behind-paver.webp', 'Crew luting fresh mat behind the paver at a KFC', 'kfc'),
  P('/images/real_jobs/kfc-dusk-crew-roller.webp', 'Four-man crew and roller working a KFC drive-thru at dusk', 'kfc'),
  P('/images/real_jobs/kfc-drive-thru-demo-cat.webp', 'Excavator and skid steer cutting out a KFC drive-thru', 'kfc'),
  P('/images/real_jobs/kfc-sealed-striped-company-truck.webp', 'Sealed and restriped KFC lot with the company truck on site', 'kfc'),
  P('/images/real_jobs/kfc-lot-sealed-striped-open.webp', 'KFC lot sealed, striped, and back open to traffic', 'kfc'),
]

// The kfc-job series: our own phone photography across the franchise
// programme, shot job-by-job. Frames that are unusable (blur, closeups of
// drains and bollards, windshield shots) are excluded by number.
const KFC_JOB_EXCLUDE = new Set([3, 9, 10, 12, 16, 31, 37, 39, 40, 44, 46, 47])
for (let i = 1; i <= 40; i++) {
  if (KFC_JOB_EXCLUDE.has(i)) continue
  const n = String(i).padStart(3, '0')
  JOB_PHOTOS.push(P(`/work/kfc/kfc-job-${n}.webp`, 'Franchise lot during programme service, shot by our crew', 'kfc'))
}

// portfolio-001..020: the long-standing driveway portfolio (021+ excluded
// permanently — stock furniture ads found in the folder).
const PORTFOLIO_ALTS = {
  1: 'New driveway at a cul-de-sac home', 2: 'New asphalt driveway winding through trees',
  3: 'Long ribbon driveway, freshly paved', 4: 'Driveway paved and edged, taped off to cure',
  5: 'Fresh driveway with clean lawn edges', 6: 'Finished drive at a white-columned home',
  7: 'Skid steer grading a driveway base', 8: 'Crew member raking fresh mix on a long drive',
  9: 'New driveway at a farmhouse', 10: 'Roller compacting a driveway beside black fabric edging',
  11: 'Hand crew screeding hot mix behind the paver', 12: 'Fresh gray mat rolled tight',
  13: 'Paver working a residential drive from the truck', 14: 'Steam rising off fresh asphalt',
  15: 'Retail drive lane repaved and open', 16: 'Wide fresh mat across a commercial lot',
  17: 'Crew and paver at a white colonial home', 18: 'Road shoulder paving in open country',
  19: 'Accessible parking freshly striped at a retail lot', 20: 'Country lane paved through a fence line',
}
for (let i = 1; i <= 20; i++) {
  const n = String(i).padStart(3, '0')
  JOB_PHOTOS.push(P(`/work/portfolio/portfolio-${n}.webp`, PORTFOLIO_ALTS[i], i >= 15 && i !== 17 && i !== 18 ? 'commercial' : 'residential'))
}

export const photosByCategory = (category, { market = 'VA', limit } = {}) => {
  const out = JOB_PHOTOS.filter((p) => p.category === category && (market === 'all' || p.market === market))
  return limit ? out.slice(0, limit) : out
}

export const JOB_PHOTO_COUNT = JOB_PHOTOS.length
