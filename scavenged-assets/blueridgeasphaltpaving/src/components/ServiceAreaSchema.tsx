export default function ServiceAreaSchema({ city, state = 'VA' }: { city: string, state?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Service", "LocalBusiness", "GeneralContractor"],
    "name": `Blue Ridge Estate Paving in ${city}, ${state}`,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Blue Ridge Estate Paving"
    },
    "areaServed": {
      "@type": "City",
      "name": city,
      "addressRegion": state
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Mountain-Grade Asphalt Paving Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Mountain-Grade Paving" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Residential Steep Driveways" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Appalachian Sealcoating & Maintenance" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Asphalt Milling" } }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
