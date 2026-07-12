import React, { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Phone, CheckCircle, Star, ArrowRight, MapPin } from 'lucide-react';
import type { LocationDataWithRegion, TenantConfig } from '@jworden/core';

interface Props {
  location: LocationDataWithRegion;
  nearby: LocationDataWithRegion[];
  tenant: TenantConfig;
}

export function LocationPage({ location, nearby, tenant }: Props) {
  const { business, branding, compliance, pricing, engineering, services } = tenant;
  const phoneHref = `tel:${business.phoneE164}`;
  const siteUrl = business.website;
  const cityState = `${location.city}, ${location.stateAbbr}`;
  const countyText = location.county;
  const title = `${location.h1} | ${business.shortName}`;
  const canonicalUrl = `${siteUrl}/locations/${location.slug}`;

  useEffect(() => {
    document.title = title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement('meta');
      desc.setAttribute('name', 'description');
      document.head.appendChild(desc);
    }
    desc.setAttribute('content', location.metaDescription);

    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement('link');
      canon.setAttribute('rel', 'canonical');
      document.head.appendChild(canon);
    }
    canon.setAttribute('href', canonicalUrl);

    return () => {
      document.title = `${business.shortName} | ${branding.tagline}`;
    };
  }, [title, location.metaDescription, canonicalUrl, business.shortName, branding.tagline]);

  useEffect(() => {
    const priceRange = `$${pricing.residentialSqftMin.toFixed(2)}–$${pricing.residentialSqftMax.toFixed(2)} per sq ft`;
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${canonicalUrl}#business`,
        name: `${business.shortName} — ${cityState}`,
        telephone: business.phoneE164,
        priceRange: '$$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: business.address,
          addressLocality: business.addressCity,
          addressRegion: business.addressStateAbbr,
          postalCode: business.addressZip,
          addressCountry: 'US',
        },
        areaServed: {
          '@type': 'City',
          name: location.city,
          containedInPlace: { '@type': 'AdministrativeArea', name: countyText },
        },
        url: canonicalUrl,
        ...(branding.ratingValue && branding.ratingCount ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: branding.ratingValue,
            reviewCount: String(branding.ratingCount),
          },
        } : {}),
        openingHoursSpecification: [
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '19:00' },
          { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '07:00', closes: '17:00' },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Service Area', item: `${siteUrl}/locations` },
          { '@type': 'ListItem', position: 3, name: cityState, item: canonicalUrl },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How much does ${business.primaryTrade} cost in ${cityState}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${business.primaryTrade.charAt(0).toUpperCase() + business.primaryTrade.slice(1)} in ${cityState} typically runs ${priceRange} for residential projects. Commercial pricing depends on scope, base condition, and access. ${business.shortName} provides free on-site estimates throughout ${countyText}.`,
            },
          },
          {
            '@type': 'Question',
            name: `Do you serve all of ${location.city}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes. We serve throughout ${cityState} and the broader ${countyText} area, including driveways, parking lots, and projects of every size.`,
            },
          },
          {
            '@type': 'Question',
            name: `Are you licensed and insured in ${location.stateAbbr}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes. ${business.shortName} holds ${compliance.licenseStatement}, ${compliance.bond}${compliance.bbbRating ? `, and ${compliance.bbbRating}` : ''}.`,
            },
          },
          {
            '@type': 'Question',
            name: 'How do I get a free estimate?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Call us at ${business.phone} or submit the online estimator. We respond within 24 hours and schedule a free on-site visit throughout ${countyText}.`,
            },
          },
        ],
      },
    ];

    const existing = document.querySelectorAll('script[data-location-schema]');
    existing.forEach((el) => el.remove());

    schemas.forEach((schema, i) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-location-schema', String(i));
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-location-schema]').forEach((el) => el.remove());
    };
  }, [location.slug]);

  return (
    <div className="bg-zinc-950 text-white">
      {/* Breadcrumbs */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-xs text-zinc-500 flex gap-2">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/locations" className="hover:text-white transition-colors">Service Area</Link>
          <span>/</span>
          <span className="text-zinc-300">{cityState}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.04] pt-14 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,166,35,0.07),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold mb-4">
            <MapPin size={12} />
            <span>Serving {countyText}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            {location.h1}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mb-8 leading-relaxed">
            {business.shortName} has been the trusted {business.primaryTrade} contractor in {cityState} since {business.founded}.
            {engineering.compactionPct}% Marshall compaction on every project. {compliance.licenseStatement}.
            {compliance.bbbRating ? ` ${compliance.bbbRating}.` : ''}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={phoneHref}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg transition-colors"
            >
              <Phone size={15} /> Call {business.phone}
            </a>
            <Link
              to="/estimator"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Free Estimate <ArrowRight size={15} />
            </Link>
          </div>

          {branding.ratingValue && branding.ratingCount && (
            <div className="mt-8 flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <span>{branding.ratingValue} / 5.0 · {branding.ratingCount.toLocaleString()} Google reviews</span>
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="py-16 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {business.tradeLabel} Services in {cityState}
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            Every service backed by our engineering standard — {engineering.compactionPct}% compaction, certified materials, ±${engineering.oilShieldPerTon}/ton oil price protection.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.title} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-yellow-500/30 transition-colors">
                <h3 className="font-semibold text-white mb-2 text-sm">{s.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Why {location.city} Property Owners Choose {business.shortName}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                We've been serving {location.stateAbbr} since {business.founded}.
                {business.generation ? ` That's ${business.generation} of family knowledge —` : ' Decades of experience —'}
                knowing which base specifications hold up in {countyText}'s conditions,
                and how to build a pavement that outlasts the competition by years.
              </p>
              <ul className="space-y-2.5">
                {compliance.trustSignals.map((s) => (
                  <li key={s} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <CheckCircle size={14} className="text-yellow-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-6">Our Engineering Standard</div>
              <div className="space-y-4">
                {engineering.specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-white font-medium text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">
            {business.tradeLabel} FAQ — {cityState}
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does ${business.primaryTrade} cost in ${cityState}?`,
                a: `Residential projects typically run $${pricing.residentialSqftMin.toFixed(2)}–$${pricing.residentialSqftMax.toFixed(2)} per square foot in ${cityState}, including excavation, base preparation, and paving. Commercial pricing varies by scope. Contact us for a free on-site estimate — we respond within 24 hours.`,
              },
              {
                q: `How long does new ${business.primaryTrade} last in ${countyText}?`,
                a: `With our ${engineering.baseDepthIn}-inch structural stone base and ${engineering.compactionPct}% compaction standard, projects in ${countyText} typically last 20–30 years. The biggest factor is base quality — inadequate base is why most pavements fail early.`,
              },
              {
                q: `When is the best time for ${business.primaryTrade} in ${cityState}?`,
                a: `Spring and fall are ideal — ground temperatures above 45°F, precipitation below 40%. We monitor weather daily and won't work in conditions that compromise quality. We'll advise you on the right window for your project.`,
              },
              {
                q: 'Do you offer financing or payment plans?',
                a: `We accept a ${Math.round(pricing.depositPct * 100)}% deposit via credit card or check, with the balance due upon completion. For large commercial projects, we can discuss phased payment schedules. Call us to discuss your project.`,
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-zinc-800 pb-6 last:border-0">
                <h3 className="font-semibold text-white mb-2 text-sm">{faq.q}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby cities */}
      {nearby.length > 0 && (
        <section className="py-12 border-b border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-white mb-6">Also Serving Nearby Areas</h2>
            <div className="flex flex-wrap gap-2">
              {nearby.map((loc) => (
                <Link
                  key={loc.slug}
                  to="/locations/$slug"
                  params={{ slug: loc.slug }}
                  className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  {loc.city}, {loc.stateAbbr}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Ready to Start Your {location.city} Project?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Free on-site estimates throughout {countyText}. Same-week scheduling available.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <a href={phoneHref} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3.5 rounded-lg transition-colors">
              <Phone size={15} /> {business.phone}
            </a>
            <Link to="/estimator" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors">
              Online Estimate <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
