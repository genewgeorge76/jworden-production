/**
 * texasPhotos.js — the photo slot for the Texas brand site.
 *
 * WHY THIS FILE IS EMPTY, AND WHY THAT IS THE POINT
 * ────────────────────────────────────────────────
 * The Texas programme is real: 23 invoiced KFC sites for KBP Foods across 19
 * cities, evidenced by the invoice tracker. The PHOTOGRAPHS of it are not in
 * this repository. Every one of the 280 images here was checked; 152 carry GPS
 * and none of them are in Texas.
 *
 * The images do exist — in the mail archive, attached to the job they belong
 * to, named by the crew who took them:
 *
 *     Marshall, Texas KFC Pictures.zip
 *     Waco, Texas KFC roof pictures.zip
 *     Conroe, Texas KFC roof pictures.zip
 *
 * They need a Google Takeout to extract. Until that happens this array stays
 * empty, and the gallery section does not render at all.
 *
 * THE THING NOT TO DO
 * ───────────────────
 * Do not fill this with a Virginia photograph, a stock image, or a placeholder
 * with a caption implying it is Texas work. A real photograph of the wrong job
 * is the same failure as the fabricated store database that was served on every
 * domain until it was deleted — true image, false implication. An empty gallery
 * costs a section; a borrowed one costs the only thing that makes the rest of
 * the page worth believing.
 *
 * If you cannot say where and when a photograph was taken, it does not go here.
 *
 * ADDING REAL ONES
 * ────────────────
 * Drop the files in `public/texas/` and add an entry per photograph. Every
 * field below is REQUIRED — the builder drops any entry missing one, because a
 * photograph without a place and a date is not evidence of anything:
 *
 *     {
 *       file:  'waco-g135216-after-01.jpg',  // in public/texas/
 *       city:  'Waco',                        // must match a TX_SITES city
 *       store: 'G135216',                     // the store it belongs to
 *       phase: 'after',                       // before | during | after
 *       taken: '2016-08',                     // YYYY or YYYY-MM, what is known
 *       alt:   'Finished drive-thru lane and parking bay at the Waco KFC, ...',
 *       width: 1600,
 *       height: 1200,
 *     }
 *
 * `phase` matters: only `after` photographs may appear in a gallery that sells
 * finished work. A "before" image is a photograph of somebody else's failure,
 * and app/services/photo_email.py grades those `listed` rather than
 * `completed` for exactly this reason.
 */

/** @typedef {{file:string,city:string,store:string,phase:'before'|'during'|'after',taken:string,alt:string,width:number,height:number}} TexasPhoto */

/** @type {TexasPhoto[]} */
export const TEXAS_PHOTOS = []

/** Fields without which an entry is not evidence and will not be rendered. */
const REQUIRED = ['file', 'city', 'store', 'phase', 'taken', 'alt', 'width', 'height']

/**
 * The entries fit to publish: complete, and showing finished work.
 *
 * Returns [] when nothing qualifies, which is the current state and is
 * deliberately not an error.
 */
export function publishablePhotos(photos = TEXAS_PHOTOS) {
  return photos.filter((photo) => {
    if (!photo || typeof photo !== 'object') return false
    const complete = REQUIRED.every((field) => {
      const value = photo[field]
      return typeof value === 'number' ? Number.isFinite(value) && value > 0 : Boolean(String(value || '').trim())
    })
    // Only finished work. See the note on `phase` above.
    return complete && photo.phase === 'after'
  })
}

/** The publishable photographs for one city, newest first where dates allow. */
export function photosForCity(city, photos = TEXAS_PHOTOS) {
  const wanted = String(city || '').trim().toLowerCase()
  if (!wanted) return []
  return publishablePhotos(photos)
    .filter((photo) => String(photo.city).trim().toLowerCase() === wanted)
    .sort((a, b) => String(b.taken).localeCompare(String(a.taken)))
}
