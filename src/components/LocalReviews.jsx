import React from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Award } from 'lucide-react';

// Real, verified review data from public profiles.
// Source: Google Search results for "J. Worden & Sons Paving LLC" (April 2026).
// Update these numbers as profile counts grow.
const REVIEW_PLATFORMS = [
  {
    name: 'Houzz',
    rating: 4.8,
    count: 12,
    url: 'https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484',
    accent: '4× Best of Houzz Service',
  },
  {
    name: 'Angi',
    rating: 4.5,
    count: 15,
    url: 'https://www.angi.com/companylist/us/va/chester/j-worden-and-sons-paving-reviews-7601083.htm',
    accent: 'Verified Pro',
  },
  {
    name: 'Facebook',
    rating: 4.3,
    count: 57,
    url: 'https://www.facebook.com/jwordenpaving/',
    accent: '130+ followers',
  },
];

const ACHIEVEMENTS = [
  'Pavement Magazine Top 75 — 4 Categories',
  '2026 Top Contractor Award',
  'Best of Houzz Service — 2014, 2015, 2016, 2023',
  'Houzz Pro + Recommended + 500 Saves Badges',
  'NASCLA Certified',
  'Virginia Class A Contractor',
];

// Real verified review excerpts from houzz.com
const HOUZZ_REVIEWS = [
  {
    author: 'jaclynforrester',
    date: 'June 23, 2016',
    rating: 5,
    excerpt: "We had a major drainage issue in a brand new pea gravel driveway — a pond and sometimes an ice skating rink on one side. I called every reference and we drove by the addresses; all of his customers were happy with his work. In 4 days the driveway was done. It's beautiful, it drains perfectly, and Gene's communication and his team's professionalism were excellent. They truly care about their work.",
  },
  {
    author: 'Greg Orlick',
    date: 'April 19, 2022',
    rating: 5,
    excerpt: 'They paved our driveway 18 months ago with paver entries. Did a fabulous job. We ran into drainage issues, not their fault — they were great at fixing them and everything went as agreed. I would recommend them to everyone.',
  },
  {
    author: 'daryllhall',
    date: 'March 30, 2015',
    rating: 5,
    excerpt: 'J. Worden & Sons did a great job on our new driveway. Gene was friendly, courteous and provided excellent customer service. His crew even went above and beyond by moving and staging a supply of wood materials we had temporarily stored on our old driveway.',
  },
  {
    author: 'Susan Armentrout',
    date: 'November 9, 2013',
    rating: 5,
    excerpt: "We hired J. Worden & Sons to repair and repave our large asphalt driveway. Gene's many years of experience in this family owned business, fair price, and great finished projects in our neighborhood led us to contract with him. Friendly, professional and efficient crew with all the best machinery. We are very happy with the result.",
  },
];

const HOUZZ_SCREENSHOT = '/logo.png';

// Aggregate weighted average across all platforms (honest math, no inflation).
const totalReviews = REVIEW_PLATFORMS.reduce((sum, p) => sum + p.count, 0);
const weightedAvg = (
  REVIEW_PLATFORMS.reduce((sum, p) => sum + p.rating * p.count, 0) / totalReviews
).toFixed(1);

const StarRow = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`${size} ${
          i <= Math.round(rating) ? 'fill-primary text-primary' : 'text-muted'
        }`}
      />
    ))}
  </div>
);

export default function LocalReviews() {
  return (
    <section id="reviews" className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Verified Reviews
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
              Rated By Real
              <br />
              <span className="text-primary">Customers</span>
            </h2>
            <p className="font-body text-muted-foreground text-base md:text-lg mt-5 max-w-xl leading-relaxed">
              Every review below is publicly verifiable on the platforms our customers used to post them. Click any badge to read the full reviews.
            </p>
          </div>

          {/* Aggregate */}
          <div className="flex items-center gap-4 border border-border bg-card p-5">
            <StarRow rating={Math.round(weightedAvg)} size="w-5 h-5" />
            <div>
              <p className="font-display font-black text-foreground text-2xl leading-none">
                {weightedAvg} / 5
              </p>
              <p className="font-display text-muted-foreground text-[11px] tracking-wider uppercase mt-1">
                {totalReviews} verified reviews
              </p>
            </div>
          </div>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {REVIEW_PLATFORMS.map((platform, i) => (
            <motion.a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group border border-border bg-card p-7 hover:border-primary transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <p className="font-display font-black text-foreground text-2xl uppercase tracking-tight">
                  {platform.name}
                </p>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <p className="font-display font-black text-primary text-5xl leading-none">
                  {platform.rating}
                </p>
                <p className="font-display text-muted-foreground text-sm tracking-wider">/ 5</p>
              </div>

              <StarRow rating={platform.rating} />

              <p className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase mt-4">
                {platform.count} verified reviews
              </p>

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <p className="font-display text-primary text-[10px] tracking-[0.2em] uppercase font-bold">
                  {platform.accent}
                </p>
                <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase group-hover:text-primary transition-colors">
                  Read →
                </p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Houzz Awards screenshot — verifiable proof from houzz.com */}
        <motion.a
          href="https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="group block border border-border bg-card hover:border-primary transition-all duration-300 mb-12 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Screenshot */}
            <div className="relative bg-white p-6 md:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-border">
              <img
                src={HOUZZ_SCREENSHOT}
                alt="Screenshot from houzz.com verifying J. Worden & Sons Paving LLC has earned 4 Houzz Awards — Best of Houzz Service 2014, 2015, 2016, and 2023 — plus 3 Houzz Badges (Houzz Pro Software User, Recommended, and 500 Ideabook Saves) and 12 verified customer reviews."
                loading="lazy"
                className="max-w-full max-h-[520px] object-contain"
              />
              <span className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                Verified
              </span>
            </div>

            {/* Context */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-3">
                // Houzz Awards — Verifiable on Houzz.com
              </p>
              <h3 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight leading-[0.95] mb-5">
                4 Houzz Awards.<br />
                <span className="text-primary">3 Badges.</span>
              </h3>
              <p className="font-body text-muted-foreground text-base leading-relaxed mb-6">
                Best of Houzz Service winners across four years — 2014, 2015, 2016, and 2023 — awarded directly by Houzz based on verified client review scores. Plus the Houzz Pro Software, Recommended, and 500 Ideabook Saves badges.
              </p>
              <div className="space-y-2 mb-8">
                {[
                  'Best of Houzz Service — 2023',
                  'Best of Houzz Service — 2016',
                  'Best of Houzz Service — 2015',
                  'Best of Houzz Service — 2014',
                  'Houzz Pro Software User Badge',
                  'Houzz Recommended Badge',
                  'Houzz 500 Ideabook Saves Badge',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary shrink-0" />
                    <span className="font-display text-foreground text-xs tracking-[0.15em] uppercase">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase group-hover:underline">
                View on Houzz.com →
              </p>
            </div>
          </div>
        </motion.a>

        {/* Achievements bar */}
        <div className="border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-1">
                  Industry Recognition
                </p>
                <p className="font-display font-black text-foreground text-lg uppercase tracking-tight">
                  Awarded & Certified
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map((a) => (
                <span
                  key={a}
                  className="px-3 py-2 border border-border text-foreground font-display text-[10px] tracking-[0.15em] uppercase"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Verified Houzz review excerpts */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-2">
                // Verified on Houzz.com
              </p>
              <h3 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight">
                What Customers Say
              </h3>
            </div>
            <a
              href="https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484"
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-primary text-[10px] tracking-[0.2em] uppercase hover:underline shrink-0"
            >
              All 12 Reviews on Houzz →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HOUZZ_REVIEWS.map((r) => (
              <div key={r.author} className="border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <StarRow rating={r.rating} />
                  <span className="font-display text-muted-foreground text-[10px] tracking-[0.15em] uppercase">
                    {r.date}
                  </span>
                </div>
                <p className="font-body text-foreground text-sm leading-relaxed mb-4">
                  “{r.excerpt}”
                </p>
                <p className="font-display text-primary text-[10px] tracking-[0.2em] uppercase">
                  — {r.author} · Houzz
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
