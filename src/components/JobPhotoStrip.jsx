import { photosByCategory } from '../data/jobPhotos'

/**
 * JobPhotoStrip — a responsive band of real job photographs for any page.
 *
 * Pulls from the central registry (src/data/jobPhotos.js), so pages never
 * hand-pick file paths and the no-stock / no-invented-location rules are
 * enforced in one place. Virginia pages default to Virginia frames.
 */
export default function JobPhotoStrip({
  category,
  heading = 'Our work, photographed on the job',
  intro,
  limit = 6,
  market = 'VA',
  linkToGallery = true,
}) {
  const photos = photosByCategory(category, { market, limit })
  if (!photos.length) return null
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[#112337] tracking-tight">{heading}</h2>
            {intro ? <p className="text-gray-600 mt-2 max-w-2xl">{intro}</p> : null}
          </div>
          {linkToGallery ? (
            <a href="/gallery" className="text-[#facc15] font-bold text-sm uppercase tracking-[0.05em] hover:underline shrink-0">
              Full gallery →
            </a>
          ) : null}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {photos.map((p) => (
            <figure key={p.src} className="overflow-hidden rounded-lg bg-gray-100">
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-44 md:h-56 object-cover hover:scale-[1.03] transition-transform duration-500"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
