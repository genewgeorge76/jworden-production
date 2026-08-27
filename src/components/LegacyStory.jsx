import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, Home as HomeIcon, Utensils } from 'lucide-react'
import SmartImage from './SmartImage'

const residentialPhotos = [
  {
    url: '/images/real_jobs/asphalt driveways goochland va.jpg',
    title: 'Goochland Estate Driveway Paving',
    location: 'Goochland, VA',
    category: 'Residential Estate'
  },
  {
    url: '/images/real_jobs/circlular asphalt driveway chesterfield va.jpg',
    title: 'Chesterfield Custom Circular Driveway',
    location: 'Chesterfield, VA',
    category: 'Custom Layout'
  },
  {
    url: '/images/real_jobs/big asphalt driveay richmond va.jpg',
    title: 'Richmond Estate Asphalt Entrance',
    location: 'Richmond, VA',
    category: 'Estate Driveway'
  },
  {
    url: '/images/real_jobs/driveway asphalt paving winsor farms.jpg',
    title: 'Windsor Farms Luxury Residential Entrance',
    location: 'Windsor Farms, VA',
    category: 'Luxury Paving'
  },
  {
    url: '/images/real_jobs/asphalt driveway with brick edging.jpg',
    title: 'Custom Asphalt Driveway with Brick Edging',
    location: 'Henrico, VA',
    category: 'Brick Edging Detail'
  },
  {
    url: '/images/real_jobs/asphalt driveway chesterfield va.jpg',
    title: 'Chesterfield Residential Driveway Resurfacing',
    location: 'Chesterfield, VA',
    category: 'Driveway Resurfacing'
  },
  {
    url: '/images/blueridge/driveway.png',
    title: 'Precision Sub-Base Driveway Preparation',
    location: 'Richmond, VA',
    category: 'Sub-Base Prep'
  },
  {
    url: '/images/real_jobs/driveway paving new kent.jpg',
    title: 'New Kent Residential Driveway Paving',
    location: 'New Kent, VA',
    category: 'Residential Paving'
  }
]

const commercialPhotos = [
  {
    url: '/images/real_jobs/COMMERCIALPAVING 2026.jpg',
    title: 'Richmond Commercial Parking Lot Reconstruction',
    location: 'Richmond, VA',
    category: 'Lot Reconstruction'
  },
  {
    url: '/images/real_jobs/HANDICAP UPGRADE WALGREENS.JPG',
    title: 'Walgreens ADA Ramp & Handicap Parking Upgrade',
    location: 'Richmond, VA',
    category: 'ADA Upgrade'
  },
  {
    url: '/images/real_jobs/asphalt paving car lot on midlothian.jpg',
    title: 'Midlothian Turnpike Dealership Resurfacing',
    location: 'Midlothian, VA',
    category: 'Commercial Dealership'
  },
  {
    url: '/images/real_jobs/cvs asphalt paving.jpg',
    title: 'CVS Pharmacy Parking Lot Paving & Tie-In',
    location: 'Henrico, VA',
    category: 'Retail Parking'
  },
  {
    url: '/images/blueridge/milling.png',
    title: 'Industrial Park Heavy Asphalt Milling & Overlay',
    location: 'Richmond, VA',
    category: 'Heavy Milling'
  },
  {
    url: '/images/blueridge/sealcoating.png',
    title: 'Commercial Plaza Polymer Sealcoating & Striping',
    location: 'Glen Allen, VA',
    category: 'Sealcoating & Lines'
  },
  {
    url: '/images/blueridge/machinery.png',
    title: 'Heavy Commercial Asphalt Paver Operation',
    location: 'Chesterfield, VA',
    category: 'Heavy Equipment'
  },
  {
    url: '/images/real_jobs/cvs paving picture.jpg',
    title: 'CVS Commercial Access & Entrance Repairs',
    location: 'Richmond, VA',
    category: 'Commercial Repairs'
  }
]

/**
 * Job photographs from the QSR programme.
 *
 * These carried invented captions: store numbers (#1042, #1105, #2014 …),
 * per-photo scopes and city locations, none of which came from any record. The
 * store numbers matched none of the real ones (135, 149, 162, 184, 186, 189,
 * 195, 207, 356, 369), and at least one photograph captioned as a drive-thru
 * concrete pad is a roadside erosion cut. The photographs are genuine; the
 * captions were not, and EXIF is gone, so nothing truthful about place or scope
 * can be recovered from the files.
 *
 * They are shown unlabelled. The verified portfolio — thirty-nine restaurants
 * with store numbers, street addresses and dated client records — lives in
 * src/data/nationalProjects.json and is rendered by KfcNationalProgram. That is
 * where a franchise buyer should be sent, not at a caption we cannot stand
 * behind.
 */
// Neutral directory names. They used to read store_04_atlanta_peachtree and
// store_07_orlando_idrive — and a path is visible in page source, so the
// fabricated grouping was still being published even after the captions were
// removed. There is nothing truthful to name these after: the photographs are
// an unsorted set.
const kfcPhotos = [
  '/images/kfc_stores/set_01/kfc_store_01_photo_1.jpg',
  '/images/kfc_stores/set_02/kfc_store_02_photo_1.jpg',
  '/images/kfc_stores/set_03/kfc_store_03_photo_1.jpg',
  '/images/kfc_stores/set_04/kfc_store_04_photo_1.JPG',
  '/images/kfc_stores/set_05/kfc_store_05_photo_1.JPG',
  '/images/kfc_stores/set_06/kfc_store_06_photo_1.JPG',
  '/images/kfc_stores/set_07/kfc_store_07_photo_1.JPG',
  '/images/kfc_stores/set_08/kfc_store_08_photo_1.JPG'
].map((url) => ({
  url,
  title: 'QSR restaurant programme',
  category: 'KFC Franchise'
}))

function MarqueeRow({ items, reverse = false, speed = 35 }) {
  // Duplicate array to create a seamless infinite looping marquee scroll track
  const duplicated = [...items, ...items]

  return (
    <div className="relative overflow-hidden w-full group rounded-2xl border border-white/10 bg-brand-navy/60 p-2 shadow-2xl">
      {/* Edge gradient vignettes */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-brand-navy to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-brand-navy to-transparent z-20 pointer-events-none" />
      
      {/* Continuous scrolling track with GPU-accelerated keyframe animation & native hover/focus pause */}
      <div
        className={`flex gap-4 sm:gap-6 w-max ${
          reverse ? 'animate-marquee-right' : 'animate-marquee-left'
        } group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]`}
        style={{ '--marquee-duration': `${speed}s` }}
      >
        {duplicated.map((item, idx) => (
          <div 
            key={`${item.title}-${idx}`}
            className="w-72 sm:w-80 flex-shrink-0 relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 group/item shadow-lg transition-all duration-300 hover:border-brand-amber/50 hover:shadow-2xl"
          >
            <SmartImage
              src={item.url}
              alt={item.title}
              width={800}
              height={600}
              priority={false}
              sizes="(max-width: 640px) 280px, 320px"
              className="w-full h-full object-cover transform group-hover/item:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover/item:opacity-95 transition-opacity" />
            <div className="absolute bottom-3 left-3 right-3 z-10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-amber bg-brand-amber/10 px-2 py-0.5 rounded border border-brand-amber/20">
                  {item.category || item.location}
                </span>
                {item.location && item.category && (
                  <span className="text-[10px] text-white/60 font-sans">{item.location}</span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover/item:text-brand-amber transition-colors drop-shadow-md">
                {item.title}
              </p>
              {item.scope && (
                <p className="text-[10px] text-white/70 truncate hidden sm:block">
                  {item.scope}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LegacyStory() {
  const timeline = [
    {
      year: '1984',
      title: 'The Foundation — Residential Paving Excellence',
      icon: HomeIcon,
      description: 'Founded by J. Worden Sr. after 30+ years in the roofing industry, transitioning a legacy of hard work into asphalt paving. He built the company on a simple promise: "Do it right the first time."',
      items: residentialPhotos,
      reverse: false,
      speed: 36
    },
    {
      year: '2015',
      title: 'A New Era of Leadership — Commercial Growth',
      icon: Building2,
      description: 'GW George takes the helm after working alongside his grandfather since the age of 14. We expanded our commercial footprint, bringing national-level quality to the Richmond area while keeping our family-first values intact.',
      items: commercialPhotos,
      reverse: true,
      speed: 42
    },
    {
      year: 'Today',
      title: 'The Third Generation — KFC National Franchise Program',
      icon: Utensils,
      // "Southeast" undersold this by a continent. The documented record spans
      // eleven states — Michigan, New Jersey, Texas, Illinois and Missouri among
      // them — plus ground-up restaurant builds delivered as general contractor.
      description: 'The legacy continues. Paving, sealcoating and resurfacing programmes across a national KFC portfolio — eleven states from Michigan to Texas to New Jersey — plus ground-up restaurant construction as general contractor. The Atlanta metro alone ran to well over a hundred restaurants.',
      items: kfcPhotos,
      reverse: false,
      speed: 38
    }
  ]

  return (
    <section className="py-24 bg-brand-navy text-white relative overflow-hidden" id="legacy">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-brand-amber mb-4">
            Three Generations of Real Work Proof
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            From our grandfather's first residential driveway to multi-million dollar commercial lots and 100+ KFC franchise store projects, the Worden name stands for uncompromised quality in Virginia since 1984.
          </p>
        </motion.div>

        <div className="grid gap-16 lg:gap-24">
          {timeline.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div 
                key={item.year}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.15 }}
                className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12"
              >
                <div className="w-full lg:w-1/2 space-y-6">
                  <div className="inline-flex items-center gap-2 bg-brand-amber/10 border border-brand-amber/30 text-brand-amber font-bold text-sm px-3 py-1.5 rounded-full">
                    <Icon className="w-4 h-4 text-brand-amber" />
                    <span>Est. {item.year}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                    {item.title}
                  </h3>

                  <p className="text-lg text-white/70 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2">
                    <a 
                      href="#gallery" 
                      className="text-brand-amber font-semibold hover:text-white transition-colors inline-flex items-center gap-2 group"
                    >
                      Explore Complete Project Record <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>

                <div className="w-full lg:w-1/2">
                  <MarqueeRow items={item.items} reverse={item.reverse} speed={item.speed} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


