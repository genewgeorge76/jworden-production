import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { api } from '@/api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import SmartImage from '../components/SmartImage';
import { PRIMARY_DOMAIN } from '@/lib/locations';
import { FALLBACK_BLOG_POSTS } from '@/lib/fallbackBlogPosts';

const BLOG_FAQS = [
  {
    q: 'How often should asphalt driveways be sealcoated in Virginia?',
    a: 'Most driveways in Virginia benefit from sealcoating about every 2 to 3 years depending on traffic, sun exposure, and drainage conditions.',
  },
  {
    q: 'When should I repair asphalt versus replace it?',
    a: 'If the base is stable, targeted repairs or overlays may be effective. If there is widespread base failure, full reconstruction is typically the better long-term choice.',
  },
  {
    q: 'Do climate and freeze-thaw cycles affect asphalt lifespan?',
    a: 'Yes. Freeze-thaw movement, water intrusion, and heat cycles materially impact performance, which is why drainage and maintenance planning are critical.',
  },
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.entities.BlogPost.list('-published_date', 100)
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const safePosts = Array.isArray(posts) && posts.length > 0 ? posts : FALLBACK_BLOG_POSTS;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PRIMARY_DOMAIN}/blog#page`,
        url: `${PRIMARY_DOMAIN}/blog`,
        name: 'J. Worden & Sons Paving LLC Blog',
        description:
          'Expert guides on asphalt paving, sealcoating, driveway maintenance, and commercial paving across Central Virginia and the Southeast.',
      },
      {
        '@type': 'Blog',
        '@id': `${PRIMARY_DOMAIN}/blog#blog`,
        url: `${PRIMARY_DOMAIN}/blog`,
        name: 'J. Worden & Sons Paving LLC Blog',
        description:
          'Expert guides on asphalt paving, sealcoating, driveway maintenance, and commercial paving across Central Virginia and the Southeast.',
        publisher: {
          '@type': 'Organization',
          name: 'J. Worden & Sons Paving LLC',
        },
        blogPost: safePosts.map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.excerpt,
          url: `${PRIMARY_DOMAIN}/blog/${p.slug}`,
          datePublished: p.published_date,
          image: p.cover_image,
          author: { '@type': 'Organization', name: p.author || 'J. Worden & Sons' },
        })),
      },
      {
        '@type': 'ItemList',
        name: 'Latest Asphalt Paving Blog Articles',
        itemListElement: safePosts.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${PRIMARY_DOMAIN}/blog/${p.slug}`,
          name: p.title,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: BLOG_FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: PRIMARY_DOMAIN },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${PRIMARY_DOMAIN}/blog` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Asphalt Paving Blog | Expert Guides & Maintenance Tips | J. Worden & Sons"
        description="Expert asphalt paving guides — driveway maintenance, sealcoating timing, commercial parking lot longevity, Virginia climate impact, and more. 40+ years of paving wisdom."
        canonicalPath="/blog"
        jsonLd={jsonLd}
      />
      <Navbar />

      <section className="pt-32 pb-12 border-b border-border relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-primary/16 blur-3xl" />
        <div className="absolute bottom-0 -left-16 w-56 h-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            // Knowledge Base
          </p>
          <h1 className="font-display font-black text-foreground text-5xl md:text-7xl uppercase tracking-tight">
            Paving Insights
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-6 max-w-2xl leading-relaxed">
            Forty years of asphalt knowledge — distilled. Climate-specific guides, material breakdowns, maintenance schedules, and commercial paving deep-dives.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : safePosts.length === 0 ? (
            <p className="font-display text-muted-foreground text-sm tracking-wider uppercase text-center py-16">
              No articles published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safePosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group premium-panel rounded-2xl overflow-hidden hover:border-primary/40 transition-colors duration-300 flex flex-col"
                >
                  {post.cover_image && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <SmartImage
                        src={post.cover_image}
                        alt={`${post.title} — J. Worden & Sons Paving LLC expert guide`}
                        width={1280}
                        height={800}
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="w-full h-full object-cover quality-premium transition-transform duration-700 group-hover:scale-105"
                      />
                      {post.category && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                          {post.category.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-tight mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                      {post.published_date && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span className="font-display text-xs tracking-wider uppercase">
                            {new Date(post.published_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {post.read_time_minutes && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span className="font-display text-xs tracking-wider uppercase">
                            {post.read_time_minutes} min read
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-4">
            // Popular Service Paths
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            <Link to="/commercial/richmond-va" className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors">
              Commercial Paving Richmond
            </Link>
            <Link to="/locations" className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors">
              Service Areas
            </Link>
            <Link to="/#quote" className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors">
              Request Free Estimate
            </Link>
            <Link to="/blog" className="px-3 py-2 border border-border text-muted-foreground font-display text-[11px] tracking-wider hover:border-primary/40 hover:text-foreground transition-colors">
              Paving Knowledge Center
            </Link>
          </div>

          <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-4">
            // Blog FAQ
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BLOG_FAQS.map((item) => (
              <article key={item.q} className="border border-border bg-card p-5">
                <h3 className="font-display font-black text-foreground text-base uppercase tracking-tight leading-tight">
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
