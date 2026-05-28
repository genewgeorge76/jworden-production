import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Quote } from 'lucide-react';
import { api } from '@/api/client';

const StarRow = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`${size} ${i <= Math.round(rating) ? 'fill-primary text-primary' : 'text-muted'}`}
      />
    ))}
  </div>
);

export default function GoogleReviewsLive() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.functions.invoke('fetchGoogleReviews', {})
      .then((res) => setData(res?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Silent if not configured — we keep LocalReviews as the fallback.
  if (loading) return null;
  if (!data?.configured || !data?.reviews?.length) return null;

  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Live from Google
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight leading-[0.95]">
              What Neighbors
              <br />
              <span className="text-primary">Are Saying</span>
            </h2>
          </div>
          <a
            href={data.mapsUri || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 border border-border bg-card p-5 hover:border-primary transition-colors"
          >
            <StarRow rating={data.rating || 5} size="w-5 h-5" />
            <div>
              <p className="font-display font-black text-foreground text-2xl leading-none">
                {data.rating?.toFixed(1) || '5.0'} / 5
              </p>
              <p className="font-display text-muted-foreground text-[11px] tracking-wider uppercase mt-1">
                {data.total} Google reviews
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.reviews.slice(0, 6).map((r, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border border-border bg-card p-6 flex flex-col"
            >
              <Quote className="w-6 h-6 text-primary mb-4" />
              <StarRow rating={r.rating} />
              <p className="font-body text-foreground text-sm leading-relaxed mt-4 mb-6 flex-1 line-clamp-6">
                {r.text}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                {r.authorPhoto ? (
                  <img src={r.authorPhoto} alt={r.author} className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-xs">
                    {r.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">
                    {r.author}
                  </p>
                  <p className="font-body text-muted-foreground text-[11px]">{r.relativeTime}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
