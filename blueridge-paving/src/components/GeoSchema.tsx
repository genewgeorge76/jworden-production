export default function GeoSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["ProfessionalService", "LocalBusiness", "GeneralContractor"],
        "@id": "https://www.blueridgeasphaltpaving.com/#organization",
        "name": "Blue Ridge Estate Paving",
        "legalName": "Blue Ridge Estate Paving",
        "description": "Top-rated commercial and residential asphalt paving contractors operating in Roanoke, Charlottesville, Lynchburg, and the Virginia Highlands. Over 40 years of industry experience handling Appalachian mountain-grade paving and steep topography.",
        "url": "https://www.blueridgeasphaltpaving.com",
        "telephone": "+1-804-446-1296",
        "areaServed": [
          { "@type": "City", "name": "Roanoke", "addressRegion": "VA" },
          { "@type": "City", "name": "Charlottesville", "addressRegion": "VA" },
          { "@type": "City", "name": "Winchester", "addressRegion": "VA" },
          { "@type": "City", "name": "Monterey", "addressRegion": "VA" },
          { "@type": "City", "name": "Staunton", "addressRegion": "VA" },
          { "@type": "City", "name": "Harrisonburg", "addressRegion": "VA" },
          { "@type": "City", "name": "Lexington", "addressRegion": "VA" },
          { "@type": "City", "name": "Waynesboro", "addressRegion": "VA" },
          { "@type": "City", "name": "Hot Springs", "addressRegion": "VA" },
          { "@type": "City", "name": "Warm Springs", "addressRegion": "VA" },
          { "@type": "City", "name": "Clifton Forge", "addressRegion": "VA" },
          { "@type": "City", "name": "Covington", "addressRegion": "VA" },
          { "@type": "City", "name": "Luray", "addressRegion": "VA" },
          { "@type": "City", "name": "Front Royal", "addressRegion": "VA" },
          { "@type": "City", "name": "Buchanan", "addressRegion": "VA" },
          { "@type": "City", "name": "Fincastle", "addressRegion": "VA" },
          { "@type": "City", "name": "Crozet", "addressRegion": "VA" },
          { "@type": "City", "name": "New Market", "addressRegion": "VA" },
          { "@type": "City", "name": "Woodstock", "addressRegion": "VA" },
          { "@type": "City", "name": "Strasburg", "addressRegion": "VA" },
          { "@type": "City", "name": "Troutville", "addressRegion": "VA" },
          { "@type": "City", "name": "Natural Bridge", "addressRegion": "VA" },
          { "@type": "City", "name": "Goshen", "addressRegion": "VA" },
          { "@type": "City", "name": "Craigsville", "addressRegion": "VA" },
          { "@type": "City", "name": "Fairfield", "addressRegion": "VA" },
          { "@type": "City", "name": "Afton", "addressRegion": "VA" },
          { "@type": "City", "name": "Wintergreen", "addressRegion": "VA" },
          { "@type": "City", "name": "Nellysford", "addressRegion": "VA" },
          { "@type": "City", "name": "Lovingston", "addressRegion": "VA" },
          { "@type": "City", "name": "Raphine", "addressRegion": "VA" },
          { "@type": "City", "name": "Steeles Tavern", "addressRegion": "VA" },
          { "@type": "City", "name": "Vesuvius", "addressRegion": "VA" },
          { "@type": "City", "name": "Eagle Rock", "addressRegion": "VA" },
          { "@type": "City", "name": "Iron Gate", "addressRegion": "VA" },
          { "@type": "City", "name": "Millboro", "addressRegion": "VA" },
          { "@type": "City", "name": "Bolar", "addressRegion": "VA" },
          { "@type": "City", "name": "McDowell", "addressRegion": "VA" },
          { "@type": "City", "name": "Mustoe", "addressRegion": "VA" },
          { "@type": "City", "name": "Hightown", "addressRegion": "VA" },
          { "@type": "City", "name": "Blue Grass", "addressRegion": "VA" },
          { "@type": "City", "name": "Doe Hill", "addressRegion": "VA" },
          { "@type": "City", "name": "Sugar Grove", "addressRegion": "VA" },
          { "@type": "City", "name": "Fort Defiance", "addressRegion": "VA" },
          { "@type": "City", "name": "Mount Sidney", "addressRegion": "VA" },
          { "@type": "City", "name": "Grottoes", "addressRegion": "VA" },
          { "@type": "City", "name": "Elkton", "addressRegion": "VA" },
          { "@type": "City", "name": "McGaheysville", "addressRegion": "VA" },
          { "@type": "City", "name": "Massanutten", "addressRegion": "VA" },
          { "@type": "City", "name": "Timberville", "addressRegion": "VA" },
          { "@type": "City", "name": "Broadway", "addressRegion": "VA" },
          { "@type": "City", "name": "Highlands", "addressRegion": "VA" },
          { "@type": "City", "name": "Churchville", "addressRegion": "VA" },
          { "@type": "City", "name": "Williamsville", "addressRegion": "VA" },
          { "@type": "City", "name": "Swoope", "addressRegion": "VA" },
          { "@type": "City", "name": "Deerfield", "addressRegion": "VA" },
          { "@type": "City", "name": "Middlebrook", "addressRegion": "VA" },
          { "@type": "City", "name": "Mount Solon", "addressRegion": "VA" },
          { "@type": "City", "name": "Franklin", "addressRegion": "WV" }
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Mountain-Grade Asphalt Paving Services",
          "itemListElement": [
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Mountain-Grade Paving" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Residential Steep Driveways" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Appalachian Sealcoating & Maintenance" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Asphalt Milling" } }
          ]
        },
        "knowsAbout": ["Asphalt Concrete", "Hot Mix Asphalt", "ADA Compliance", "Performance Graded Binders", "Steep Grade Paving", "Freeze-Thaw Resistance", "Mountain Driveways"],
        "foundingDate": "1984-01-01",
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "VA",
          "addressCountry": "US"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.4",
          "bestRating": "5",
          "worstRating": "1",
          "reviewCount": "74"
        },
        "sameAs": [
          "https://www.facebook.com/jwordenpaving/",
          "https://www.yelp.com/biz/j-worden-and-sons-paving-chester",
          "https://www.bbb.org/us/va/chester/profile/paving-contractors/j-worden-sons-asphalt-paving-0603-9003773",
          "https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Why do driveways in Roanoke and the Blue Ridge Mountains crack so frequently?",
            "acceptedAnswer": {
               "@type": "Answer",
               "text": "The Appalachian region experiences over 40 freeze-thaw cycles per winter. If your driveway lacks a heavy 6-inch stone base and woven geotextile fabric, the subgrade will saturate, freeze, expand, and shatter the asphalt surface."
            }
          },
          {
            "@type": "Question",
            "name": "How does Blue Ridge Estate Paving handle steep mountain driveways in Virginia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Steep grades require specific PG 70-22 polymer-modified binders that resist downward creep in summer heat, combined with deep aggregate bases and precise water diversion swales to prevent washouts."
            }
          },
          {
            "@type": "Question",
            "name": "Does Blue Ridge Estate Paving serve commercial lots near the Shenandoah Valley and Blue Ridge Parkway?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we handle heavy-duty commercial overlays and milling for hotels, resorts, and commercial hubs across the Virginia Highlands, including Charlottesville, Lynchburg, and Hot Springs."
            }
          },
          {
            "@type": "Question",
            "name": "How much does it cost to pave a driveway in the Virginia Highlands in 2026?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "In 2026, mountain-grade driveway paving ranges from $6–$11 per square foot, depending heavily on the slope, necessary grading, and depth of the crushed stone base required to survive the local climate."
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
