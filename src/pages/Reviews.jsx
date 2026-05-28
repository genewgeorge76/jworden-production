import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SchemaMarkup, { reviewsSchema } from '../components/SchemaMarkup'
import { api, trackEvent } from '../api/client'
import SocialShare from '../components/SocialShare'
import LiveReviewBadges from '../components/LiveReviewBadges'

// Fallback in case API is unavailable
const FALLBACK = {
  aggregate_rating: 4.9,
  total_reviews: 87,
  reviews: [
    {
      author: 'Mark D.',
      rating: 5,
      text: 'J. Worden & Sons did an outstanding job on our commercial parking lot. On time, on budget, and the quality is exceptional.',
      date: '2024-11-15',
      source: 'Google',
    },
    {
      author: 'Patricia H.',
      rating: 5,
      text: 'Our driveway looks brand new. They showed up on schedule, got it done in one day, and the price was very fair.',
      date: '2024-10-22',
      source: 'Google',
    },
    {
      author: 'Riverside KFC Management',
      rating: 5,
      text: 'We have used J. Worden & Sons for all three of our franchise locations. Every project has been flawless.',
      date: '2024-09-08',
      source: 'Google',
    },
  ],
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${star <= rating ? 'text-brand-amber' : 'text-gray-200'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function ReviewCard({ review, index }) {
  return (
    <motion.div
      className="premium-panel p-6 rounded-2xl"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.1 }}
    >
      <StarRating rating={review.rating} />
      <p className="mt-3 text-foreground/85 text-sm leading-relaxed">&ldquo;{review.text}&rdquo;</p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-foreground text-sm">{review.author}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {new Date(review.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </div>
        </div>
        <span className="text-xs text-foreground/75 bg-primary/10 border border-primary/25 px-2 py-1 rounded-full">
          {review.source}
        </span>
      </div>
    </motion.div>
  )
}

export default function Reviews() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getReviews()
      .then((d) => setData(d?.aggregate_rating ? d : FALLBACK))
      .catch(() => setData(FALLBACK))
      .finally(() => setLoading(false))
    trackEvent('page_view', { page: '/reviews' })
  }, [])

  const { aggregate_rating, total_reviews, reviews } = data || FALLBACK

  return (
    <>
      <SchemaMarkup
        title={`${aggregate_rating}★ Reviews — What Customers Say`}
        description={`J. Worden & Sons has a ${aggregate_rating}-star average across ${total_reviews} Google reviews. Read what homeowners and commercial clients say about our asphalt paving work.`}
        canonical="/reviews"
        schema={data ? reviewsSchema(reviews, aggregate_rating) : undefined}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Reviews', path: '/reviews' },
        ]}
      />

      {/* Header */}
      <div className="bg-brand-navy pt-32 pb-20 text-white text-center relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display font-black text-5xl md:text-6xl mb-4">
            Customer <span className="text-brand-amber">Reviews</span>
          </h1>
          <p className="text-white/70 text-xl mb-6">What our clients say after the job is done.</p>
          <div className="flex justify-center">
            <SocialShare
              path="/reviews"
              text="J. Worden & Sons — 4.9★ across 87 Google reviews. See what customers say."
              compact
            />
          </div>
        </div>
      </div>

      {/* Platform Badges */}
      <section className="py-12 bg-gray-50 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Verified On These Platforms
          </p>
          <LiveReviewBadges />

          {/* Houzz Awards */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Houzz Awards &amp; Recognition</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://www.houzz.com/professionals/paving-contractors/j-worden-sons-asphalt-paving-pfvwus-pf~48430947"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#111] border border-[#4dbc15]/50 hover:border-[#4dbc15] px-4 py-3 transition-colors group"
              >
                <span className="w-7 h-7 bg-[#4dbc15] flex items-center justify-center rounded font-black text-white text-sm">h</span>
                <div>
                  <p className="font-bold text-white text-xs tracking-wider uppercase leading-tight group-hover:text-[#4dbc15] transition-colors">Houzz Pro Certified</p>
                  <p className="text-white/50 text-[10px]">Recommended · 500+ Saves</p>
                </div>
              </a>
              {['2023', '2016', '2015', '2014'].map(year => (
                <a
                  key={year}
                  href="https://www.houzz.com/professionals/paving-contractors/j-worden-sons-asphalt-paving-pfvwus-pf~48430947"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center bg-[#111] border border-[#4dbc15]/40 hover:border-[#4dbc15] px-3 py-2 transition-colors"
                >
                  <span className="text-[#4dbc15] font-black text-[9px] tracking-widest uppercase">Best of Houzz</span>
                  <span className="text-white font-bold text-base leading-tight">{year}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Aggregate score */}
      <section className="py-14 bg-background border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {loading ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-brand-amber border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div>
                <div className="font-display font-black text-7xl text-foreground">
                  {aggregate_rating}
                </div>
                <div className="flex gap-1 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-brand-amber text-2xl">
                      ★
                    </span>
                  ))}
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  {total_reviews} Google reviews
                </div>
              </div>
              <div className="h-px w-20 sm:h-20 sm:w-px bg-border" />
              <div className="text-left">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3 mb-1">
                      <span className="text-xs text-muted-foreground w-8">{star}★</span>
                      <div className="w-36 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-amber rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Review cards */}
      <section className="py-16 bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-brand-amber border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <ReviewCard key={i} review={review} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Google Maps Live Embed */}
      <section className="py-16 bg-gray-50 border-t border-border/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-3xl text-foreground">Find Us on Google Maps</h2>
            <p className="text-muted-foreground mt-2">See our live rating and read all reviews directly on Google</p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
            <iframe
              src="https://maps.google.com/maps?q=J+Worden+%26+Sons+Asphalt+Paving+Chester+VA&output=embed"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="J. Worden & Sons Paving LLC on Google Maps"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <a
              href="https://maps.google.com/maps?q=J+Worden+%26+Sons+Asphalt+Paving+Chester+VA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow hover:shadow-md transition text-sm font-semibold text-gray-800"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Open in Google Maps
            </a>
            <a
              href="https://www.houzz.com/professionals/paving-contractors/j-worden-sons-asphalt-paving-pfvwus-pf~48430947"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow hover:shadow-md transition text-sm font-semibold text-gray-800"
            >
              <span className="text-[#4dbc15] font-black text-base">h</span>
              View on Houzz
            </a>
            <a
              href="https://www.angi.com/companylist/us/va/chester/j-worden-and-sons-asphalt-paving-reviews-"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow hover:shadow-md transition text-sm font-semibold text-gray-800"
            >
              <span className="text-[#FF6153] font-black text-sm">Angi</span>
              View on Angi
            </a>
          </div>
        </div>
      </section>

      {/* Leave a review CTA */}
      <section className="py-16 bg-brand-navy text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display font-black text-3xl mb-4">Had a great experience?</h2>
          <p className="text-white/60 mb-8">
            Your review helps other Virginia homeowners and businesses find quality asphalt contractors. Takes 60 seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`https://search.google.com/local/writereview?placeid=${import.meta.env.VITE_GOOGLE_PLACE_ID || 'ChIJG3X8o_OStokRzRynNBuVfQ0'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition"
              onClick={() => trackEvent('review_cta_click', { platform: 'google', location: 'reviews_page' })}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Review on Google ⭐
            </a>
            <a
              href="https://www.houzz.com/professionals/paving-contractors/j-worden-sons-asphalt-paving-pfvwus-pf~48430947"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#4dbc15] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#3da010] transition"
              onClick={() => trackEvent('review_cta_click', { platform: 'houzz', location: 'reviews_page' })}
            >
              <span className="font-black text-lg leading-none">h</span>
              Review on Houzz
            </a>
            <a
              href="https://www.angi.com/companylist/us/va/chester/j-worden-and-sons-asphalt-paving-reviews-"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FF6153] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#e54f43] transition"
              onClick={() => trackEvent('review_cta_click', { platform: 'angi', location: 'reviews_page' })}
            >
              <span className="font-black text-sm leading-none">Angi</span>
              Review on Angi
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
