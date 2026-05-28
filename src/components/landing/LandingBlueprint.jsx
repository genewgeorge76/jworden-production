import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuickQuoteBar from '@/components/QuickQuoteBar'
import { buildLandingJsonLd } from '@/lib/landingPages'
import {
  trackLandingPageView,
  trackLandingPrimaryCta,
  trackQualifiedLeadSignal,
} from '@/lib/analytics'

export default function LandingBlueprint({ page }) {
  useEffect(() => {
    if (!page) return
    trackLandingPageView(page)
  }, [page])

  if (!page) return null

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${page.title} | J. Worden & Sons`}
        description={page.metaDescription}
        canonicalPath={page.canonicalPath}
        ogImage={page.ogImage}
        jsonLd={buildLandingJsonLd(page)}
      />
      <Navbar />

      <section className="border-b border-border pt-32 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-4">
            {page.serviceArea} // {page.primaryKeyword}
          </p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-5xl">
            {page.headline}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
            {page.subheadline}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to={page.cta.href}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
              onClick={() => {
                trackLandingPrimaryCta(page, 'hero_primary')
                trackQualifiedLeadSignal(page, 'site_assessment_click')
              }}
            >
              {page.cta.label}
            </Link>
            <a
              href="tel:+18044461296"
              className="border border-primary/50 text-primary px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
              onClick={() => trackLandingPrimaryCta(page, 'hero_phone')}
            >
              Call 804-446-1296
            </a>
          </div>

          {/* 1-tap lead capture: just the phone number, no long form. */}
          <div className="mt-8 max-w-2xl">
            <QuickQuoteBar source={`lp:${page.slug || page.canonicalPath || 'unknown'}`} servicePreset="paving" />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-14 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {page.trustPoints.map((item) => (
            <article key={item} className="border border-border bg-card p-5">
              <h2 className="font-display font-black text-foreground text-lg uppercase tracking-tight">
                Proof Signal
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-14 border-b border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-4">Outcome Targets</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {page.outcomes.map((item) => (
              <article key={item} className="border border-border bg-card p-5">
                <h3 className="font-display font-black text-foreground text-base uppercase tracking-tight leading-tight">
                  {item}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-14 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-4">Authority References</p>
          <div className="flex flex-wrap gap-2">
            {page.citations.map((c) => (
              <a
                key={c.url}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-14 border-b border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-4">Backlink Asset</p>
          <article className="border border-border bg-card p-6">
            <h2 className="font-display font-black text-foreground text-2xl uppercase tracking-tight">
              {page.backlinkAsset.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              {page.backlinkAsset.description}
            </p>
            <div className="mt-4 border border-border bg-background p-3 text-xs text-muted-foreground break-all">
              {page.backlinkAsset.embedSnippet}
            </div>
          </article>
        </div>
      </section>

      <section className="py-12 md:py-14 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-4">FAQ</p>
          <div className="space-y-4">
            {page.faq.map((item) => (
              <article key={item.q} className="border border-border bg-card p-5">
                <h3 className="font-display font-black text-foreground text-lg uppercase tracking-tight leading-tight">
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 bg-primary">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display font-black text-primary-foreground text-3xl md:text-4xl uppercase tracking-tight">
            Ready For A Precision Site Plan?
          </h2>
          <p className="text-primary-foreground/80 text-sm md:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
            Tell us your surface type, square footage, timeline, and constraints. We will map the fastest path to durable performance.
          </p>
          <Link
            to={page.cta.href}
            className="inline-flex items-center gap-2 mt-6 bg-background text-foreground px-6 py-4 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-foreground hover:text-background transition-colors"
            onClick={() => trackLandingPrimaryCta(page, 'footer_primary')}
          >
            {page.cta.label}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
