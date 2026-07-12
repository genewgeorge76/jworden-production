import { useState, useEffect, useRef } from 'react';
import { testimonials } from '../data/testimonials';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xl ${star <= rating ? 'text-[#ffcc00]' : 'text-zinc-700'}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = testimonials.length;

  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const goTo = (i: number) => setCurrent(i);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, total]);

  const t = testimonials[current];

  return (
    <section className="py-24 px-6 lg:px-12 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#ffcc00] font-black uppercase tracking-[0.3em] text-sm">Customer Reviews</span>
          <h2 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tight mt-3">
            What Our Clients <span className="text-[#ffcc00]">Say</span>
          </h2>
          <div className="w-24 h-1 bg-[#ffcc00] mx-auto mt-6"></div>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="bg-black border-2 border-zinc-800 rounded-2xl p-10 md:p-14 shadow-2xl min-h-[280px] flex flex-col justify-between transition-all">
            <div>
              <StarRating rating={t.rating} />
              <blockquote className="mt-6 text-lg md:text-xl text-zinc-200 font-medium leading-relaxed italic">
                "{t.text}"
              </blockquote>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-white font-black text-lg">{t.name}</p>
                <p className="text-zinc-200 text-sm font-bold">{t.city}</p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="bg-[#ffcc00] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {t.projectType}
                </span>
                <time className="text-zinc-200 text-xs" dateTime={t.date}>
                  {new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </time>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous review"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 bg-zinc-900 border border-zinc-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:border-[#ffcc00] hover:text-[#ffcc00] transition-colors shadow-lg"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next review"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 bg-zinc-900 border border-zinc-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:border-[#ffcc00] hover:text-[#ffcc00] transition-colors shadow-lg"
          >
            ›
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Review slides">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to review ${i + 1}`}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current ? 'bg-[#ffcc00] w-6' : 'bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>

        {/* Leave a Review CTA */}
        <div className="text-center mt-12">
          <a
            href="https://www.google.com/maps/place/J.+Worden+%26+Sons+Paving+LLC"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const w = window as unknown as { gtag?: (...args: unknown[]) => void };
              if (w.gtag) w.gtag('event', 'click', { event_category: 'review_cta', event_label: 'google_business' });
            }}
            className="inline-flex items-center gap-3 bg-[#ffcc00] text-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,204,0,0.3)]"
          >
            ⭐ Leave Us a Google Review
          </a>
          <p className="text-zinc-300 text-xs mt-3">Share your experience — it helps other homeowners find quality paving contractors.</p>
        </div>
      </div>
    </section>
  );
}
