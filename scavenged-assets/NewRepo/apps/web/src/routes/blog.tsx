import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';

interface BlogPostSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  author: string;
  read_time_minutes: number | null;
  tags: string | null;
  published_at: string | null;
}

interface BlogListResponse {
  total: number;
  posts: BlogPostSummary[];
}

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Asphalt Paving Blog | J. Worden & Sons';
  }, []);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${apiBase}/api/v1/blog/?limit=20`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: BlogListResponse) => {
        setPosts(data.posts);
        setTotal(data.total);
      })
      .catch(() => setError('Could not load articles'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-zinc-950 min-h-screen py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold mb-3">
            <BookOpen size={12} /> Resource Center
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Asphalt Paving Blog</h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Expert guidance on asphalt paving, sealcoating, maintenance, and Virginia contracting from four generations of experience.
          </p>
        </div>

        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
                <div className="h-3 bg-zinc-800 rounded w-full mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-zinc-500">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Articles coming soon.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group bg-zinc-900/60 border border-zinc-800 hover:border-yellow-500/30 rounded-xl p-6 transition-all"
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="block"
                >
                  <h2 className="text-white font-bold text-lg mb-2 group-hover:text-yellow-400 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-600">
                      {post.published_at && (
                        <span>{new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      )}
                      {post.read_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {post.read_time_minutes} min read
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium">
                      Read <ArrowRight size={11} />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
