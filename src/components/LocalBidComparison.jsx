import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react'
import { trackPhoneClick } from '@/lib/analytics'

const COMPARISON_POINTS = [
  'Line-item scope with base depth, mix type, and tonnage assumptions',
  'Documented repair-vs-replace recommendation before quote',
  'Drainage and ADA checks included up front',
  'Written workmanship warranty and clear maintenance plan',
  'Compaction process and roller pass plan explained in writing',
  'Who handles permit and traffic control coordination, if needed',
]

export default function LocalBidComparison() {
  return (
    <section className="border-t border-border py-16 md:py-24 relative overflow-hidden">
      <div className="absolute -top-16 left-0 w-72 h-72 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2 premium-panel rounded-2xl p-6 md:p-8">
            <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-3">Local Bid Comparison</p>
            <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95]">
              Comparing Richmond Paving Contractors?
            </h2>
            <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed mt-5 max-w-3xl">
              If you are reviewing quotes from local companies like RVA Asphalt Sealcoating,
              Mark Morrison Paving, Total Asphalt, Richmond Paving Inc, and J. Worden & Sons,
              use this checklist to keep bids apples-to-apples.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-7">
              {COMPARISON_POINTS.map((point) => (
                <div key={point} className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-black/10 px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/90 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-panel rounded-2xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Need A Second Opinion?</p>
              <h3 className="font-display font-black text-foreground text-2xl uppercase tracking-tight">Get A Clear Scope Review</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                We will review your current quote, identify missing scope items, and give you a practical recommendation before you commit.
              </p>
            </div>

            <div className="space-y-3 mt-6">
              <Link
                to="/commercial/richmond-va"
                className="w-full flex items-center justify-center gap-2 border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
              >
                Richmond Commercial Details
              </Link>

              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('local_bid_comparison')}
                className="premium-cta w-full flex items-center justify-center gap-2 text-primary-foreground px-5 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase"
              >
                <Phone className="w-4 h-4" />
                Call 804-446-1296
              </a>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                Transparent line-item estimate within 48 hours
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Local Virginia team with written workmanship warranty
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
