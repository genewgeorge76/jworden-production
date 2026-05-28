import { useState, useMemo, useEffect, useCallback } from 'react'
import GalleryUploadForm from '../components/GalleryUploadForm'
import SchemaMarkup from '../components/SchemaMarkup'
import { SITE_URL } from '../lib/businessInfo'
import { useGalleryImages } from '../hooks/useGalleryImages'
import { api } from '@/api/client'
import { useAuth } from '@/lib/AuthContext'
import { portfolioPhotos, kfcPhotos, featuredPortfolioPhotos } from '../data/legacyPortfolio'

const KFC_PAGE = 24

// ── Location display order ────────────────────────────────────────────────────
const LOCATION_ORDER = [
  'Richmond, VA', 'Chesterfield, VA', 'Goochland, VA', 'Midlothian, VA',
  'Glen Allen, VA', 'Virginia', 'South Carolina', 'Minnesota',
  'North Carolina', 'Georgia', 'Florida', 'Texas', 'Kansas',
  'Tennessee', 'Ohio', 'Michigan', 'New York', 'New Jersey',
  'Pennsylvania', 'Multi-State',
]

function locSort(a, b) {
  const ai = LOCATION_ORDER.indexOf(a)
  const bi = LOCATION_ORDER.indexOf(b)
  if (ai !== -1 && bi !== -1) return ai - bi
  if (ai !== -1) return -1
  if (bi !== -1) return 1
  return a.localeCompare(b)
}

// ── Phase badge ───────────────────────────────────────────────────────────────
function PhaseBadge({ phase, className = '' }) {
  if (!phase) return null
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
      phase === 'during'
        ? 'bg-yellow-400/90 text-black'
        : 'bg-emerald-600/90 text-white'
    } ${className}`}>
      {phase === 'during' ? 'During Job' : 'Completed'}
    </span>
  )
}

// ── Full-screen lightbox with prev / next ─────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const img = images[idx]

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  setIdx(i => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft')   setIdx(i => Math.max(i - 1, 0))
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  if (!img) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      <button
        className="absolute top-4 right-5 text-white/60 hover:text-white text-4xl leading-none z-10 transition-colors"
        aria-label="Close lightbox"
        onClick={onClose}
      >×</button>

      {idx > 0 && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl z-10 transition-all"
          onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
          aria-label="Previous photo"
        >‹</button>
      )}
      {idx < images.length - 1 && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl z-10 transition-all"
          onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
          aria-label="Next photo"
        >›</button>
      )}

      <img
        src={img.url}
        alt={img.job_name}
        className="max-w-[92vw] max-h-[78vh] rounded-2xl shadow-2xl object-contain"
        onClick={e => e.stopPropagation()}
      />

      <div className="mt-5 text-center px-8">
        <p className="text-white font-bold text-lg leading-snug">{img.job_name}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {img.location && <span className="text-white/50 text-sm">📍 {img.location}</span>}
          <PhaseBadge phase={img.phase} />
        </div>
        <p className="text-white/30 text-xs mt-2">{idx + 1} / {images.length}</p>
      </div>
    </div>
  )
}

// ── Photo card ────────────────────────────────────────────────────────────────
function PhotoCard({ image, onOpen, token, onDeleted, priority = false }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${image.job_name}"?`)) return
    setDeleting(true)
    try {
      await api.deleteGalleryImage(image.id)
      if (onDeleted) onDeleted(image.id)
    } catch {
      alert('Could not delete image.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-brand-amber/50 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-brand-amber/10 hover:-translate-y-0.5"
      onClick={() => onOpen(image)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen(image)}
      aria-label={`View: ${image.job_name}`}
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={image.url}
          alt={image.job_name}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Phase badge — top left */}
      {image.phase && (
        <div className="absolute top-2 left-2">
          <PhaseBadge phase={image.phase} />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{image.job_name}</p>
          {image.location && <p className="text-white/60 text-[10px] mt-0.5">📍 {image.location}</p>}
        </div>
      </div>

      {/* Admin delete */}
      {token && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {deleting ? '…' : '✕'}
        </button>
      )}
    </div>
  )
}

// ── Location section ──────────────────────────────────────────────────────────
function LocationSection({ location, photos, onOpen, token, onDeleted }) {
  return (
    <section className="mb-10" aria-label={`Photos from ${location}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-brand-amber text-base" aria-hidden="true">📍</span>
        <h3 className="text-white font-bold text-base">{location}</h3>
        <span className="text-white/30 text-xs">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        <div className="flex-1 h-px bg-white/10" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map(img => (
          <PhotoCard
            key={img.id}
            image={img}
            onOpen={onOpen}
            token={token}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    </section>
  )
}

// ── Main Gallery component ────────────────────────────────────────────────────
export default function Gallery() {
  const { images: liveImages, loading, error, reload, setImages } = useGalleryImages()
  const { accessToken, isAuthenticated } = useAuth()
  const [showUpload, setShowUpload]         = useState(false)
  const [activeType, setActiveType]         = useState('All')
  const [activeLocation, setActiveLocation] = useState('All')
  const [activePhase, setActivePhase]       = useState('All')
  const [lightboxImages, setLightboxImages] = useState(null)
  const [lightboxIndex, setLightboxIndex]   = useState(0)
  const [kfcPage, setKfcPage]               = useState(1)

  // Normalise live DB images into common shape
  const liveMapped = useMemo(() => liveImages.map(img => ({
    id:            img.id,
    url:           img.url,
    job_name:      img.job_name,
    location:      img.location || img.city || 'Virginia',
    locationGroup: img.location || img.city || 'Virginia',
    category:      img.category || 'Commercial',
    phase:         null,
    featured:      false,
    isLive:        true,
  })), [liveImages])

  // Normalise static portfolio photos
  const portfolioMapped = useMemo(() => portfolioPhotos.map(img => ({
    id:            img.id,
    url:           img.url,
    job_name:      img.title,
    location:      img.location,
    locationGroup: img.locationGroup || img.location,
    category:      img.category,
    phase:         img.phase || null,
    featured:      img.featured || false,
    isLive:        false,
  })), [])

  // Normalise KFC photos
  const kfcMapped = useMemo(() => kfcPhotos.map(img => ({
    id:            img.id,
    url:           img.url,
    job_name:      img.title,
    location:      img.location,
    locationGroup: img.locationGroup || img.location,
    category:      'QSR / KFC',
    phase:         img.phase,
    featured:      false,
    isLive:        false,
  })), [])

  // Non-KFC display photos (live DB + portfolio)
  const displayPhotos = useMemo(() => [...liveMapped, ...portfolioMapped], [liveMapped, portfolioMapped])

  // After primary type filter
  const typeFiltered = useMemo(() => {
    if (activeType === 'All')       return displayPhotos
    if (activeType === 'QSR / KFC') return kfcMapped
    return displayPhotos.filter(p => p.category === activeType)
  }, [activeType, displayPhotos, kfcMapped])

  // Location chips available for current type
  const locationOptions = useMemo(() => {
    if (activeType === 'All' || activeType === 'QSR / KFC') return []
    const locs = [...new Set(typeFiltered.map(p => p.locationGroup).filter(Boolean))]
    return locs.sort(locSort)
  }, [activeType, typeFiltered])

  // Final filtered set
  const filteredPhotos = useMemo(() => {
    let photos = typeFiltered
    if (activeLocation !== 'All') photos = photos.filter(p => p.locationGroup === activeLocation)
    if (activePhase    !== 'All') photos = photos.filter(p => p.phase === activePhase)
    return photos
  }, [typeFiltered, activeLocation, activePhase])

  // Group by location for sectioned view
  const groupedByLocation = useMemo(() => {
    const map = new Map()
    for (const photo of filteredPhotos) {
      const loc = photo.locationGroup || 'Virginia'
      if (!map.has(loc)) map.set(loc, [])
      map.get(loc).push(photo)
    }
    return Array.from(map.entries()).sort(([a], [b]) => locSort(a, b))
  }, [filteredPhotos])

  // KFC pagination
  const kfcVisible = useMemo(() => kfcMapped.slice(0, kfcPage * KFC_PAGE), [kfcMapped, kfcPage])

  // Featured hero photos (normalised)
  const featuredMapped = useMemo(() => featuredPortfolioPhotos.map(img => ({
    id: img.id, url: img.url, job_name: img.title,
    location: img.location, locationGroup: img.locationGroup,
    category: img.category, phase: img.phase, featured: true, isLive: false,
  })), [])

  const openLightbox = useCallback((image) => {
    const pool = activeType === 'QSR / KFC' ? kfcVisible : filteredPhotos
    const idx  = pool.findIndex(p => p.id === image.id)
    setLightboxImages(pool)
    setLightboxIndex(Math.max(0, idx))
  }, [activeType, kfcVisible, filteredPhotos])

  function changeType(type) {
    setActiveType(type)
    setActiveLocation('All')
    setActivePhase('All')
    if (type !== 'QSR / KFC') setKfcPage(1)
  }

  function handleUploaded(newImage) {
    setImages(prev => [newImage, ...prev])
    setShowUpload(false)
  }
  function handleDeleted(id) {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const adminUiVisible =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('admin') === '1' ||
     window.location.hash.includes('admin=1'))

  const showLocationFilter = (activeType === 'Residential' || activeType === 'Commercial') && locationOptions.length > 1
  const showPhaseFilter    = activeType !== 'QSR / KFC'
  const isKfcView          = activeType === 'QSR / KFC'
  const isAllClean         = activeType === 'All' && activeLocation === 'All' && activePhase === 'All'

  const totalDisplay = portfolioMapped.length + liveMapped.length
  const totalAll     = totalDisplay + kfcMapped.length

  return (
    <div className="min-h-screen bg-brand-navy pt-20">
      <SchemaMarkup
        title="Project Photo Gallery — Real Paving Jobs"
        description="Real J. Worden & Sons asphalt paving jobs grouped by location — Richmond, Chesterfield, Goochland, and KFC franchise sites nationwide. See the quality before you book."
        canonical="/gallery"
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Gallery', path: '/gallery' },
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'J. Worden & Sons — Project Photo Gallery',
          description: 'Real asphalt paving, driveway, and parking lot projects by J. Worden & Sons — grouped by location.',
          url: `${SITE_URL}/gallery`,
          image: liveImages.slice(0, 20).map(img => ({
            '@type': 'ImageObject',
            contentUrl: img.url,
            name: img.job_name,
            description: img.description || img.job_name,
            uploadDate: img.uploaded_at,
            creditText: 'J. Worden & Sons Paving LLC',
          })),
        }}
      />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Our Work
          </span>
          <h1 className="font-display font-black text-4xl md:text-5xl text-white mb-4">
            Project Photo Gallery
          </h1>
          <p className="text-white/60 text-lg">
            Real jobs. Grouped by location. {totalDisplay}+ Virginia &amp; regional projects plus {kfcMapped.length} KFC franchise sites — with during-job and completed shots.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-8">
          {[
            { n: `${totalDisplay}+`, label: 'Local Projects' },
            { n: `${kfcMapped.length}+`, label: 'KFC Sites' },
            { n: '10+', label: 'VA Locations' },
            { n: '2', label: 'Project Phases' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-brand-amber font-black text-2xl">{s.n}</div>
              <div className="text-white/40 text-xs uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Filter controls ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 space-y-3">

        {/* Admin controls */}
        {adminUiVisible && (
          <div className="flex flex-wrap gap-3 pb-2">
            <button onClick={() => setShowUpload(v => !v)} className="btn-primary text-sm !py-2">
              {showUpload ? '✕ Cancel' : '+ Upload Photo'}
            </button>
            {error && (
              <button onClick={reload} className="text-sm text-brand-amber hover:text-amber-400 transition-colors">
                Reload live photos
              </button>
            )}
          </div>
        )}

        {/* Primary type tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Projects', key: 'All',       count: totalAll },
            { label: 'Residential',  key: 'Residential' },
            { label: 'Commercial',   key: 'Commercial' },
            { label: 'QSR / KFC',   key: 'QSR / KFC', count: kfcMapped.length },
          ].map(({ label, key, count }) => (
            <button
              key={key}
              onClick={() => changeType(key)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                activeType === key
                  ? 'bg-brand-amber text-brand-navy shadow-lg shadow-brand-amber/20 scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
              {count !== undefined && (
                <span className="ml-1 opacity-60 font-normal normal-case text-[10px]">({count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Location chips */}
        {showLocationFilter && (
          <div className="flex flex-wrap gap-2">
            {['All', ...locationOptions].map(loc => (
              <button
                key={loc}
                onClick={() => setActiveLocation(loc)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeLocation === loc
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/50 hover:text-white/80 border border-transparent'
                }`}
              >
                {loc === 'All' ? '📍 All Locations' : `📍 ${loc}`}
              </button>
            ))}
          </div>
        )}

        {/* Phase toggle */}
        {showPhaseFilter && (
          <div className="flex gap-2">
            {[
              { val: 'All',       label: 'All Phases' },
              { val: 'during',    label: '🔧 During Job' },
              { val: 'completed', label: '✓ Completed' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setActivePhase(val)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activePhase === val
                    ? val === 'during'
                      ? 'bg-yellow-500/25 text-yellow-300 border border-yellow-500/40'
                      : val === 'completed'
                      ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-600/40'
                      : 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Upload form ────────────────────────────────────────────────────── */}
      {adminUiVisible && showUpload && isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="max-w-lg">
            <GalleryUploadForm onUploaded={handleUploaded} />
          </div>
        </div>
      )}

      {/* ── Featured hero strip (All + no sub-filters) ─────────────────────── */}
      {isAllClean && featuredMapped.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <p className="text-brand-amber text-xs font-bold uppercase tracking-widest mb-4">Featured Projects</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {featuredMapped.slice(0, 6).map((img, i) => (
              <PhotoCard
                key={img.id}
                image={img}
                onOpen={openLightbox}
                priority={i < 3}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-amber border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-center text-white/30 text-sm py-2">
            Showing local portfolio — live database unavailable
          </p>
        )}

        {/* ── KFC vault ─────────────────────────────────────────────────── */}
        {isKfcView && (
          <div>
            {(() => {
              const grouped = new Map()
              for (const img of kfcVisible) {
                if (!grouped.has(img.locationGroup)) grouped.set(img.locationGroup, [])
                grouped.get(img.locationGroup).push(img)
              }
              return Array.from(grouped.entries()).sort(([a],[b]) => locSort(a,b)).map(([loc, photos]) => (
                <LocationSection
                  key={loc}
                  location={loc}
                  photos={photos}
                  onOpen={openLightbox}
                />
              ))
            })()}

            {kfcVisible.length < kfcMapped.length && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setKfcPage(p => p + 1)}
                  className="px-6 py-2.5 rounded-full border border-brand-amber/40 text-brand-amber text-sm font-bold hover:bg-brand-amber/10 transition-all"
                >
                  Load More — {kfcMapped.length - kfcVisible.length} remaining
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Location-grouped view (All / Residential / Commercial) ─────── */}
        {!isKfcView && (
          <>
            {groupedByLocation.length === 0 && !loading && (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">📷</p>
                <p className="text-white/50">No photos match this filter.</p>
              </div>
            )}

            {groupedByLocation.map(([location, photos]) => (
              <LocationSection
                key={location}
                location={location}
                photos={photos}
                onOpen={openLightbox}
                token={accessToken}
                onDeleted={handleDeleted}
              />
            ))}

            {/* KFC preview strip at bottom of All view */}
            {isAllClean && (
              <div className="mt-14 border-t border-white/10 pt-12">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <p className="text-brand-amber text-xs font-bold uppercase tracking-widest mb-1">National Program</p>
                    <h2 className="text-white font-bold text-2xl">KFC Franchise Sites</h2>
                    <p className="text-white/50 text-sm mt-1">{kfcMapped.length} job photos · 20+ states · during &amp; completed shots</p>
                  </div>
                  <button
                    onClick={() => changeType('QSR / KFC')}
                    className="text-brand-amber text-sm font-bold hover:text-amber-400 transition-colors border border-brand-amber/30 hover:border-brand-amber/60 px-4 py-2 rounded-full"
                  >
                    Browse all KFC photos →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {kfcMapped.slice(0, 6).map(img => (
                    <PhotoCard
                      key={img.id}
                      image={img}
                      onOpen={() => changeType('QSR / KFC')}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      {lightboxImages && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  )
}
