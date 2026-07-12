import { createRootRoute, Outlet } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useState } from 'react'
import '../index.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import MobileCTA from '../components/MobileCTA'
import SocialTracking from '../components/SocialTracking'
import GoogleIntelligence from '../components/GoogleIntelligence'
import PageLoadCurtain from '../components/PageLoadCurtain'
import SectionReveal from '../components/SectionReveal'
import SmoothScroll from '../components/SmoothScroll'

// Lazy-load Jarvis concierge so the floating widget never blocks LCP.
// Mount is deferred to first idle (or after 2s) on the client.
const JarvisChat = lazy(() => import('../components/JarvisChat'))

function DeferredJarvisChat() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2500 })
      return () => {
        const cancel = (window as unknown as { cancelIdleCallback?: (handle: number) => void }).cancelIdleCallback
        if (typeof cancel === 'function') cancel(id)
      }
    }
    const t = window.setTimeout(() => setReady(true), 2000)
    return () => window.clearTimeout(t)
  }, [])
  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <JarvisChat />
    </Suspense>
  )
}
import { SERVICE_AREAS_41 } from '../constants/serviceAreas'
import {
  SCHEMA_IDS,
  BUSINESS_NAME,
  BUSINESS_LEGAL_NAME,
  BUSINESS_DESCRIPTION,
  BUSINESS_FOUNDING_YEAR,
  ALTERNATE_NAMES,
  FOUNDER,
  TAX_ID_EIN,
  PHONE_DISPLAY,
  SITE_URL,
  ADDRESS,
  GEO,
  AGGREGATE_RATING,
  PRICE_RANGE,
  SAME_AS,
} from '../lib/businessInfo'

const BUSINESS_ID = SCHEMA_IDS.business;

const pavingContractorSchema = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": BUSINESS_ID,
  "name": BUSINESS_NAME,
  "legalName": BUSINESS_LEGAL_NAME,
  "alternateName": [...ALTERNATE_NAMES],
  "telephone": PHONE_DISPLAY,
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "image": `${SITE_URL}/images/hero-paving.jpg`,
  "description": BUSINESS_DESCRIPTION,
  "foundingDate": BUSINESS_FOUNDING_YEAR,
  "founder": {
    "@type": "Person",
    "name": FOUNDER.name,
    "jobTitle": FOUNDER.jobTitle
  },
  "taxID": TAX_ID_EIN,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": ADDRESS.streetAddress,
    "addressLocality": ADDRESS.addressLocality,
    "addressRegion": ADDRESS.addressRegion,
    "postalCode": ADDRESS.postalCode,
    "addressCountry": ADDRESS.addressCountry
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": GEO.latitude,
    "longitude": GEO.longitude
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": AGGREGATE_RATING.ratingValue,
    "reviewCount": AGGREGATE_RATING.reviewCount,
    "bestRating": AGGREGATE_RATING.bestRating,
    "worstRating": AGGREGATE_RATING.worstRating
  },
  "areaServed": SERVICE_AREAS_41.map((city) => ({
    "@type": "City",
    "name": city,
    "containedInPlace": {
      "@type": "State",
      "name": "Virginia"
    }
  })),
  "priceRange": PRICE_RANGE,
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:00",
      "closes": "19:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "07:00",
      "closes": "17:00"
    }
  ],
  "sameAs": [...SAME_AS],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Asphalt Paving Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "6-Inch Structural Base Paving", "description": "Premium industrial-grade asphalt foundation for residential and commercial properties in Central Virginia.", "serviceType": "Paving", "areaServed": "Richmond, VA Metro" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Parking Lot Installation", "description": "Full-depth commercial asphalt parking lot installation to VDOT Section 315 specifications." } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Precision Residential Driveways", "description": "Residential asphalt driveway installation with 6-inch compacted stone base." } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Municipal-Grade Sealcoating", "description": "Coal-tar or asphalt emulsion sealcoating for commercial and residential surfaces." } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "QSR Fast-Track Development (90-Day)", "description": "90-day turnkey paving solution for quick-service restaurant developments (KFC, Arby's, Taco Bell)." } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Tar & Chip / Macadam Paving", "description": "Decorative tar-and-chip (macadam) surface treatment for driveways and private roads." } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Masonry & Brick Paver Installation", "description": "Cobblestone, brick paver, and natural stone apron installation on structural base." } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Roofing — TPO, EPDM, Modified Bitumen", "description": "Commercial and residential roofing systems including TPO, EPDM, and modified bitumen per FM Global standards." } }
    ]
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does asphalt driveway paving cost in Virginia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Asphalt driveway paving in Virginia typically costs $3.50–$7.00 per square foot. J. Worden & Sons includes a standard 6-inch structural stone base in every installation to ensure longevity and prevent cracking."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best time for asphalt paving in Richmond VA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Paving season in Central Virginia typically runs from April through November when ground temperatures are consistently above 50°F for proper asphalt compaction."
      }
    },
    {
      "@type": "Question",
      "name": "What is a 6-inch structural stone base and why does it matter?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A 6-inch compacted aggregate base is a foundational layer installed beneath the asphalt surface. It provides load-bearing capacity, superior water drainage, and prevents frost-heave. J. Worden & Sons treats this as the 'Worden Minimum'—it's required on every project, not an optional upgrade."
      }
    },
    {
      "@type": "Question",
      "name": "Is J. Worden & Sons licensed and insured in Virginia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. J. Worden & Sons holds a Class A Virginia Contractor's License, is BBB Accredited with an A+ rating since 1994, and carries full liability and workers' compensation insurance. We use 0% sub-contracted labor—all work is performed by our own crews."
      }
    },
    {
      "@type": "Question",
      "name": "How quickly can J. Worden & Sons complete a commercial paving project?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We operate on a professional developer schedule. Our QSR Fast-Track program delivers commercial paving projects from raw land to striped asphalt in 90 days. We have served KFC, Arby's, Taco Bell, and Winn-Dixie on this timeline."
      }
    }
  ]
};

const speakableSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "J. Worden & Sons Paving LLC — Richmond VA",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["h1", "h2", ".speakable"]
  },
  "mainEntity": {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Who is the best-rated paving company near me in Richmond VA?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "J. Worden & Sons Paving LLC is the highest-rated paving company in the Richmond Virginia metro area, serving 41 cities with a 4th-generation 6-inch structural base standard. Call 804-446-1296 for a free estimate."
        }
      },
      {
        "@type": "Question",
        "name": "How much does a driveway cost in Midlothian Virginia?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A residential asphalt driveway in Midlothian Virginia typically costs between $3,500 and $12,000 depending on size and scope. J. Worden & Sons provides free on-site estimates. Contact us at 804-446-1296."
        }
      },
      {
        "@type": "Question",
        "name": "What paving company serves the Richmond Virginia area?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "J. Worden & Sons Paving LLC serves Richmond and 41 surrounding cities including Midlothian, Glen Allen, Chesterfield, Henrico, and more. We are 4th-generation paving specialists with a 6-inch compacted aggregate base standard."
        }
      }
    ]
  }
};

const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": BUSINESS_ID,
  "name": "J. Worden & Sons Paving LLC",
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Marcus T." },
      "datePublished": "2024-11-12",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "J. Worden & Sons repaved our entire commercial parking lot in 3 days. The 6-inch structural stone base is exactly what our property needed — zero cracking after two winters. Absolutely the best paving company in the Richmond area."
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Sandra L." },
      "datePublished": "2024-10-03",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "Our driveway looks absolutely stunning. They completed the job ahead of schedule and the crew was incredibly professional. The Worden Standard is real — this driveway is built to last decades."
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Robert H." },
      "datePublished": "2024-09-18",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "Hired J. Worden & Sons for our KFC franchise lot resurfacing. They delivered on time, within budget, and the finish meets every specification."
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Patricia W." },
      "datePublished": "2024-08-27",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "As a Chester resident, it was great to work with a local company with real heritage. My sealcoating job came out perfect. 4th generation really shows."
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "James B." },
      "datePublished": "2024-07-14",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "Called on a Monday, got an estimate on Tuesday, work started Thursday. The compaction results were verified on-site and the asphalt surface is flawless."
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Diane M." },
      "datePublished": "2024-06-05",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "We've used J. Worden & Sons twice now — once for our office park and once for our storage facility. Their 96% Marshall compaction standard is not marketing — it's real engineering."
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Kevin A." },
      "datePublished": "2024-05-22",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "Absolutely impressed with the professionalism and quality. My 200-foot driveway was completed in one day with a perfect finish. The gold standard of Virginia paving contractors — nobody else comes close."
    }
  ]
};

const nationalCorporationSchema = {
  "@context": "https://schema.org",
  "@type": ["Corporation", "HomeAndConstructionBusiness"],
  "@id": BUSINESS_ID,
  "name": "J. Worden & Sons Paving LLC",
  "legalName": "J. Worden & Sons Paving LLC",
  "foundingDate": "1984",
  "founder": { "@type": "Person", "name": "Gene W. George" },
  "description": "National commercial asphalt paving contractor operating across all 50 states. 4th-generation family business powered by JWORDENAI predictive logistics. Virginia Class A Licensed. 96% Marshall compaction standard on every project.",
  "url": "https://www.jwordenasphaltpaving.com",
  "telephone": "804-446-1296",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1601 Ware Bottom Spring Rd",
    "addressLocality": "Chester",
    "addressRegion": "VA",
    "postalCode": "23836",
    "addressCountry": "US"
  },
  "areaServed": [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
    "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
    "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
    "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
    "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
    "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
    "Virginia","Washington","West Virginia","Wisconsin","Wyoming"
  ],
  "knowsAbout": [
    "National Commercial Paving",
    "50-State Asphalt Infrastructure",
    "Commercial Parking Lot Paving",
    "VDOT Section 315 Compliance",
    "96% Marshall Unit Weight Compaction",
    "AI Asphalt Estimating Software"
  ]
};

const jwordenAISchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JWORDENAI",
  "alternateName": "JWORDENAI Paving Technology",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Proprietary AI-powered predictive logistics and pricing optimization platform for national commercial asphalt paving. Developed exclusively by J. Worden & Sons Paving LLC. Automates bid intelligence, margin protection, crew scheduling, and 50-state compliance.",
  "author": {
    "@type": "Corporation",
    "name": "J. Worden & Sons Paving LLC",
    "url": "https://www.jwordenasphaltpaving.com"
  },
  "url": "https://www.jwordenasphaltpaving.com",
  "copyrightHolder": { "@type": "Person", "name": "Gene W. George" },
  "copyrightYear": "2026",
  "keywords": "AI Asphalt Estimating Software, JWORDENAI Paving Technology, predictive logistics paving, national commercial paving AI, Plaza Street Partners Paving Contractor"
};

import { LeftSidebar, RightSidebar } from '../components/ImmersiveSidebars'

export const Route = createRootRoute({
  component: () => (
    <div className="bg-[#020617] text-slate-300 font-sans flex flex-col relative min-h-screen w-full">
      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIi8+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
      </div>

      <PageLoadCurtain />
      <SmoothScroll />
      <SectionReveal />
      <GoogleIntelligence />
      <SocialTracking />
      
      <div className="z-10 relative flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 grid grid-cols-12 gap-0 relative w-full">
          <LeftSidebar />
          <div className="col-span-12 xl:col-span-6 flex flex-col relative w-full border-x border-slate-800/30">
            <Outlet />
          </div>
          <RightSidebar />
        </main>
        
        <Footer />
      </div>

      {/* Spacer for sticky mobile CTA bar */}
      <div className="h-20 md:hidden z-10 relative" />
      <MobileCTA />
      <DeferredJarvisChat />

      {/* MASTER AUTHORITY SCHEMA — PavingContractor + AggregateRating + 41-City ServiceArea */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pavingContractorSchema) }} />

      {/* FAQ SCHEMA — Targets Google Rich Results for cost/timing queries */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* VOICE SEARCH — Speakable Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }} />

      {/* REVIEW SCHEMA — Matches visible testimonials on home page */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />

      {/* NATIONAL CORPORATION SCHEMA — 50-State Dominance Signal */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(nationalCorporationSchema) }} />

      {/* JWORDENAI SOFTWARE APPLICATION SCHEMA — Proprietary AI Technology */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jwordenAISchema) }} />
    </div>
  ),
})
