export default function ServiceAreaSchema({ city, state = 'VA' }: { city: string, state?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Service", "LocalBusiness", "GeneralContractor"],
    "name": `J. Worden & Sons Paving LLC in ${city}, ${state}`,
    "provider": {
      "@type": "LocalBusiness",
      "name": "J. Worden & Sons Paving LLC"
    },
    "areaServed": {
      "@type": "City",
      "name": city,
      "addressRegion": state
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Asphalt Paving Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Paving" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Residential Driveways" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Sealcoating & Maintenance" } },
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
