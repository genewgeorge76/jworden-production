/**
 * generate-image-sitemap.mjs
 *
 * Rebuilds public/image-sitemap.xml from the verified photo registry
 * (src/data/jobPhotos.js) so Google Images indexes the real photography
 * under the pages that actually display it. Titles and captions are the
 * registry alts — descriptions of what is in frame, never invented
 * locations. Referenced by robots.txt on the primary domain only.
 *
 * Run: node scripts/generate-image-sitemap.mjs
 */
import { writeFileSync } from 'node:fs'
import { JOB_PHOTOS, photosByCategory } from '../src/data/jobPhotos.js'

const SITE = 'https://www.jwordenasphaltpaving.com'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// Image URLs must be URI-encoded (several legacy filenames carry spaces).
const iloc = (src) => SITE + encodeURI(src)

const img = (p) => `    <image:image>
      <image:loc>${esc(iloc(p.src))}</image:loc>
      <image:title>${esc(p.alt)}</image:title>
    </image:image>`

const url = (loc, photos) => photos.length ? `  <url>
    <loc>${esc(SITE + loc)}</loc>
${photos.map(img).join('\n')}
  </url>` : ''

const PAGES = [
  ['/gallery', JOB_PHOTOS],
  ['/', [...photosByCategory('commercial', { limit: 4 }), ...photosByCategory('kfc', { limit: 4 })]],
  ['/residential', photosByCategory('residential', { limit: 8 })],
  ['/parking-lots', photosByCategory('commercial', { limit: 8 })],
  ['/virginia-sealcoating', photosByCategory('sealcoat', { limit: 6 })],
  ['/asphalt-paving', photosByCategory('commercial', { limit: 6 })],
  ['/crack-repair', photosByCategory('sealcoat', { limit: 6 })],
  ['/general-contracting', photosByCategory('construction', { limit: 6 })],
]

const body = PAGES.map(([loc, photos]) => url(loc, photos)).filter(Boolean).join('\n')
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`
writeFileSync('public/image-sitemap.xml', xml)
const count = (xml.match(/<image:image>/g) || []).length
console.log(`[image-sitemap] ${count} image entries across ${PAGES.length} pages`)
