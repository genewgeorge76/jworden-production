import React, { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Clock, ArrowLeft, AlertTriangle } from 'lucide-react';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  meta_description: string | null;
  author: string;
  read_time_minutes: number | null;
  tags: string | null;
  published_at: string | null;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black text-white mt-10 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-zinc-300">• $1</li>')
    .replace(/\n\n/g, '</p><p class="text-zinc-400 leading-relaxed mb-4">');
}

export function BlogPostPage() {
  const { slug } = useParams({ strict: false });
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    setLoading(true);
    setNotFound(false);
    setPost(null);

    fetch(`${apiBase}/api/v1/blog/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : Promise.reject(r.status);
      })
      .then((data: BlogPost | null) => {
        if (data) setPost(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | J. Worden & Sons`;
      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement('meta');
        desc.setAttribute('name', 'description');
        document.head.appendChild(desc);
      }
      desc.setAttribute('content', post.meta_description || post.excerpt || '');

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.meta_description || post.excerpt,
        author: { '@type': 'Organization', name: post.author },
        datePublished: post.published_at,
        publisher: {
          '@type': 'Organization',
          name: 'J. Worden & Sons Paving & General Contracting',
          logo: { '@type': 'ImageObject', url: 'https://www.jwordenasphaltpaving.com/logo.png' },
        },
      };
      let schemaEl = document.querySelector('script[data-blog-schema]');
      if (!schemaEl) {
        schemaEl = document.createElement('script');
        schemaEl.setAttribute('type', 'application/ld+json');
        schemaEl.setAttribute('data-blog-schema', '1');
        document.head.appendChild(schemaEl);
      }
      schemaEl.textContent = JSON.stringify(schema);
    }
    return () => {
      document.querySelectorAll('script[data-blog-schema]').forEach((el) => el.remove());
    };
  }, [post]);

  if (loading) {
    return (
      <div className="bg-zinc-950 min-h-screen py-14">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-2/3" />
            <div className="h-4 bg-zinc-800 rounded w-1/3" />
            <div className="space-y-3 mt-8">
              {[...Array(6)].map((_, i) => <div key={i} className="h-3 bg-zinc-800 rounded" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-zinc-950 min-h-screen py-14 text-center">
        <div className="max-w-xl mx-auto px-4">
          <AlertTriangle size={36} className="mx-auto mb-4 text-zinc-600" />
          <h1 className="text-2xl font-bold text-white mb-3">Article Not Found</h1>
          <p className="text-zinc-500 text-sm mb-6">
            This article may have been moved or removed.
          </p>
          <Link to="/blog" className="text-yellow-400 hover:underline text-sm">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="bg-zinc-950 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={13} /> Blog
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="text-zinc-400 text-lg leading-relaxed mb-4">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>{post.author}</span>
            {post.published_at && (
              <span>{new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
            {post.read_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> {post.read_time_minutes} min read
              </span>
            )}
          </div>
        </header>

        <div
          className="prose prose-invert max-w-none text-zinc-400 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: `<p class="text-zinc-400 leading-relaxed mb-4">${renderMarkdown(post.body || '')}</p>`,
          }}
        />

        {post.tags && (
          <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-wrap gap-2">
            {post.tags.split(',').map((t) => (
              <span key={t} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full">
                {t.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm mb-4">Need a free paving estimate?</p>
          <a
            href="tel:+18044461296"
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            Call (804) 446-1296
          </a>
        </div>
      </div>
    </div>
  );
}
