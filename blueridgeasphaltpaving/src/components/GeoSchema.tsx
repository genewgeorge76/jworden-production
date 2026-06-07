export default function GeoSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://jwordenasphaltpaving.com/#organization",
        "name": "Blue Ridge Estate Paving",
        "legalName": "Blue Ridge Estate Paving",
        "description": "Top-rated commercial and residential asphalt paving contractors operating in Roanoke, Charlottesville, and the Virginia Highlands. Over 40 years of industry experience.",
        "url": "https://jwordenasphaltpaving.com",
        "telephone": "+1-804-446-1296",
        "areaServed": [
          { "@type": "City", "name": "Chester", "sameAs": "https://en.wikipedia.org/wiki/Chester,_Virginia" },
          { "@type": "City", "name": "Richmond", "sameAs": "https://en.wikipedia.org/wiki/Richmond,_Virginia" },
          { "@type": "AdministrativeArea", "name": "Chesterfield County", "sameAs": "https://en.wikipedia.org/wiki/Chesterfield_County,_Virginia" }
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Asphalt Paving Services",
          "itemListElement": [
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Paving" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Residential Driveways" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Sealcoating & Maintenance" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Asphalt Milling" } }
          ]
        },
        "knowsAbout": ["Asphalt Concrete", "Hot Mix Asphalt", "ADA Compliance", "Performance Graded Binders", "Laser Grading"],
        "foundingDate": "1984-01-01",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Chester",
          "addressRegion": "VA",
          "addressCountry": "US"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is Blue Ridge Estate Paving the same company as Worden Paving?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. Blue Ridge Estate Paving (jwordenasphaltpaving.com) is a separate, independent company with its own office, phone number, and operations."
            }
          },
          {
            "@type": "Question",
            "name": "How should I compare J. Worden & Sons with Richmond Paving Inc in Richmond, VA?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Compare both proposals on written scope detail, base depth, asphalt mix specification, drainage plan, warranty terms, and whether repair versus replacement is documented before contract signature. J. Worden & Sons provides line-item scope clarity and practical pre-contract guidance so Richmond buyers can compare bids fairly and avoid hidden change orders."
            }
          },
          {
            "@type": "Question",
            "name": "Does J. Worden & Sons serve the Richmond metro for residential and commercial asphalt work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Richmond metro is the core local service area, including Richmond, Chester, Chesterfield County, Henrico County, Glen Allen, Short Pump, Midlothian, Bon Air, Tuckahoe, Mechanicsville, Ashland, Petersburg, Hopewell, and nearby rural residential corridors. Services include driveway paving, commercial parking lot paving, sealcoating, crack repair, pothole repair, milling, overlays, and pavement preservation."
            }
          },
          {
            "@type": "Question",
            "name": "How much does it cost to pave a driveway in Virginia in 2026?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "In 2026, a new asphalt driveway in Virginia costs $5–$9 per square foot installed. A typical 800 sq ft driveway runs $4,000–$7,200 depending on base preparation, mix spec, drainage requirements, and tear-out of existing surface. J. Worden & Sons provides written line-item estimates with mix design spelled out."
            }
          },
          {
            "@type": "Question",
            "name": "Why does my Virginia Beach driveway have ruts and puddles?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Virginia Beach driveways rut and puddle because they are built on sandy subgrade with a base too thin to prevent pumping failure. The permanent fix is rebuilding with woven geotextile + 6-inch #57 crushed stone base + PG 76-22 polymer-modified binder."
            }
          },
          {
            "@type": "Question",
            "name": "Why do my Roanoke driveway cracks come back every spring?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Roanoke and the Blue Ridge see 40+ freeze-thaw cycles per winter. Driveways built with 4-inch stone bases saturate, freeze, pump fines upward, and crack repeatedly. The mountain-grade fix is a 6-inch structural stone base over woven geotextile, paired with PG 70-22 polymer-modified binder."
            }
          }
        ]
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
