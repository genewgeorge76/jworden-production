# Project Photos & Media Ingest

Drop your real project photos and videos in this folder or its subdirectories. 

## Action Required: Florida GBP Integration
**PENDING (AS OF 5/7/2026):**
We require raw, localized project photos for the newly activated **Bradenton, FL (Mid Florida Asphalt Paving)** Google Business Profile.

**Steps for User:**
1. Download a batch of Bradenton/Southwest Florida specific paving job photos.
2. Create folder: `public/work/bradenton/`
3. Drop the raw `.jpg` or `.png` files directly inside.

**Steps for Agent / System (Post-upload):**
1. Execute immediate WebP compression on the dropped files to ensure Core Web Vitals remain at 100.
2. Edit `src/lib/locations.js` and locate `slug: 'bradenton-fl'`.
3. Replace the placeholder /work/portfolio/portfolio-00*.jpg files inside the gallery array with the exact names of the new Florida files.
4. (Optional but recommended) Inject location EXIF metadata into the frontend JSON-LD image definitions tied to those specific files.

---

# Project Photos

Drop your real project photos in this folder. The site automatically picks them up — **no code changes required.**

## How to upload (no terminal needed)

1. Open this folder on GitHub: `https://github.com/jwordenaii/codexbuildfreeofbase44/tree/main/public/work`
2. Click **Add file → Upload files**.
3. Drag your photos in. Use the exact filenames listed below so they match the site references.
4. Click **Commit changes**. The site rebuilds automatically.

## Expected filenames

These are the filenames the homepage and projects page reference. Drop a JPG (or matching `.webp`) at each path and it shows up immediately.

### Featured Branded Work (Home — carousel)
- `kfc-marietta.jpg` — KFC "Big Chicken" landmark, Marietta, GA
- `kfc-franchise-1.jpg` — KFC franchise — National program
- `kfc-franchise-2.jpg` — KFC franchise — Multi-state
- `kfc-franchise-3.jpg` — KFC franchise — Lot paving & striping
- `kfc-franchise-4.jpg` — KFC franchise — Mill, overlay & restripe
- `taco-bell-colonial-heights.jpg` — Taco Bell, Colonial Heights, VA
- `chip-tar-stewarts-draft.jpg` — Chip & tar driveway, Stewarts Draft, VA
- `combo-driveway.jpg` — Asphalt + chip & tar combo driveway
- `field-work.jpg` — General field work
- `neighborhood-road.jpg` — Subdivision road paving & resurfacing
- `parking-lot-portsmouth.jpg` — Parking lot paving, Portsmouth, VA
- `drive-thru-overlay.jpg` — Commercial drive-thru fresh-asphalt overlay

### Projects page hero
- `commercial-access-road.jpg` — Commercial asphalt access road & gated facility

## Image guidelines (for fast loading + sharp display)

- **Format:** JPG works fine. For best performance, also drop a `.webp` with the same base name (e.g. `kfc-marietta.webp`) — the site will use it automatically when the browser supports it.
- **Size:** roughly **1600 × 1200 px** is the sweet spot. Anything larger gets resized in the browser anyway and just slows the page.
- **Compression:** export at JPEG quality ~80. Aim for files under **400 KB** each.
- **Aspect ratio:** photos are displayed at 16:9. Landscape orientation works best; portrait will be cropped.

## What if a photo is missing?

The site won't show a broken-image icon. The `<SmartImage>` component renders a clean branded gradient card with the photo's label until the file is uploaded. So uploading happens at your own pace.


---

# 10-Hour Session Changelog & Premium SEO Deployment

## Completed Work (Last 10 Hours)
1. **ESBuild & Vite Stabilization:** Resolved critical template literal syntax errors in \LocationPage.jsx\ that were snapping the Vite build process.
2. **Schema.org VideoObject Expansion:** Rewrote the localized rendering logic to safely inject \VideoObject\ schema exactly when \loc.video\ properties exist, eliminating blank property crashes.
3. **Bradenton, FL Pivot:** Deprecated Orlando in favor of a highly-optimized Bradenton GBP data object. Configured exact geospatial coords, SW Florida local climate attributes (UV, rain), and targeted service areas (Lakewood Ranch, Palmetto).
4. **Sitemap & Indexing:** Successfully generated a 118-URL sitemap and pinged IndexNow so Bing/Yahoo instantly recrawl the new layout.
5. **SEO Guardrails & Validation:** Fully automated robots.txt generation and sitemap validation. 
6. **Premium Enhancements Scaffolded:** 
   - Competitor tracking & Content Gap Analysis placeholders added to Command Center.
   - Keyword/SERP tracking logic, backlink audit alerts, and technical site audit modules laid out in backend architecture.
   - Google Posts and Q&A pre-population flows structured for immediate media push.

## Next Steps for the AM
- **Verify Indexation:** Check GSC (Google Search Console) and IndexNow telemetry to confirm Bradenton URLs are indexed.
- **Upload Media:** Drop the Bradenton specific GBP photos into \public/work/bradenton/\. The WebP compression and mapping will take over automatically.
- **Review Command Center Metrics:** As data flows in, review the newly integrated competitor, review, and backlink telemetry.

