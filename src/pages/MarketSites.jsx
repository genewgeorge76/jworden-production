import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';

import { api } from '@/api/client';

/**
 * Site Factory — the PRO plan's "Local SEO Website Factory" and
 * "AI Blog Generator", which had backend endpoints and no interface at all.
 *
 * A customer paying $499 could not see a site they had launched, could not
 * read a post before it went out, and had no way to publish one deliberately.
 * The generator published straight to their live domain instead, which is how
 * it came to be shipping templated filler.
 *
 * Honest states only. Nothing here invents a site, a post, or a metric: an
 * empty account renders as empty, and a failed call renders as the failure.
 */

const STATUS_STYLES = {
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

const Panel = ({ children, className = '' }) => (
  <section className={`border border-white/10 bg-[#0a0f1c] rounded-lg ${className}`}>
    {children}
  </section>
);

const ErrorNote = ({ error, onRetry }) => (
  <div className="flex items-start gap-3 border border-red-500/30 bg-red-500/5 rounded-lg p-4">
    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
    <div className="min-w-0 flex-1">
      <p className="text-sm text-red-300 break-words">{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs uppercase tracking-[0.08em] text-red-300 hover:text-red-200 underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  </div>
);

export default function MarketSites() {
  const [sites, setSites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedHost, setSelectedHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [newSite, setNewSite] = useState({ hostname: '', city_target: '', state_target: '' });
  const [createError, setCreateError] = useState(null);

  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

  const [openPost, setOpenPost] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listMarketSites();
      const rows = response?.sites || [];
      setSites(rows);
      setSelectedHost((current) => current || rows[0]?.hostname || null);
    } catch (err) {
      setError(err?.message || 'Could not load your sites.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPosts = useCallback(async (hostname) => {
    if (!hostname) {
      setPosts([]);
      return;
    }
    try {
      const response = await api.listBlogPosts(hostname);
      setPosts(response?.posts || []);
    } catch (err) {
      setPosts([]);
      setError(err?.message || 'Could not load posts for this site.');
    }
  }, []);

  useEffect(() => { loadSites(); }, [loadSites]);
  useEffect(() => { loadPosts(selectedHost); }, [selectedHost, loadPosts]);

  const submitSite = async (event) => {
    event.preventDefault();
    if (creating) return;
    setCreateError(null);
    setCreating(true);
    try {
      await api.createMarketSite({
        hostname: newSite.hostname.trim().toLowerCase(),
        city_target: newSite.city_target.trim() || null,
        state_target: newSite.state_target.trim().toUpperCase() || null,
      });
      setNewSite({ hostname: '', city_target: '', state_target: '' });
      await loadSites();
    } catch (err) {
      setCreateError(err?.message || 'Could not launch the site.');
    } finally {
      setCreating(false);
    }
  };

  const submitGenerate = async (event) => {
    event.preventDefault();
    if (generating || !selectedHost) return;
    setGenerateError(null);
    setLastGenerated(null);
    setGenerating(true);
    try {
      const result = await api.generateBlogPost({
        hostname: selectedHost,
        topic: topic.trim(),
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      });
      setLastGenerated(result);
      setTopic('');
      setKeywords('');
      await loadPosts(selectedHost);
    } catch (err) {
      // The generator refuses rather than writing filler, so a failure here is
      // a real failure and is shown as one — not swallowed into a spinner that
      // stops.
      setGenerateError(err?.message || 'The content engine could not write this post.');
    } finally {
      setGenerating(false);
    }
  };

  const review = async (postId) => {
    setOpenPost({ id: postId, loading: true });
    try {
      const response = await api.readBlogPost(postId);
      setOpenPost({ ...response.post, loading: false });
    } catch (err) {
      setOpenPost({ id: postId, loading: false, error: err?.message || 'Could not open this post.' });
    }
  };

  const publish = async (postId) => {
    setPublishingId(postId);
    try {
      await api.publishBlogPost(postId);
      await loadPosts(selectedHost);
      setOpenPost(null);
    } catch (err) {
      setOpenPost((current) => ({ ...(current || {}), error: err?.message || 'Could not publish.' }));
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 px-4 py-8 md:px-8">
      <header className="max-w-6xl mx-auto mb-8">
        <p className="text-[10px] uppercase tracking-[0.08em] text-amber-500/80">Pro plan</p>
        <h1 className="font-display text-3xl font-bold text-white">Site Factory</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl">
          Launch a local market site, then write for it. Generated posts are saved as
          drafts — nothing reaches a live domain until you publish it here.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* ── Sites ─────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">
                <Globe className="w-4 h-4 text-amber-500" /> Your sites
              </h2>
              <button
                type="button"
                onClick={loadSites}
                className="text-slate-500 hover:text-amber-500"
                aria-label="Reload sites"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : error ? (
              <ErrorNote error={error} onRetry={loadSites} />
            ) : sites.length === 0 ? (
              <p className="text-sm text-slate-500 py-6">
                No sites yet. Launch your first one below.
              </p>
            ) : (
              <ul className="space-y-2">
                {sites.map((site) => {
                  const active = site.hostname === selectedHost;
                  return (
                    <li key={site.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedHost(site.hostname)}
                        aria-current={active ? 'true' : undefined}
                        className={`w-full text-left rounded border px-3 py-2 transition ${
                          active
                            ? 'border-amber-500/50 bg-amber-500/10'
                            : 'border-white/10 hover:border-white/25'
                        }`}
                      >
                        <span className="block truncate text-sm font-medium text-white">
                          {site.hostname}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {[site.city_target, site.state_target].filter(Boolean).join(', ') || 'No market set'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300 mb-4">
              <Plus className="w-4 h-4 text-amber-500" /> Launch a site
            </h2>
            <form onSubmit={submitSite} className="space-y-3">
              <input
                required
                value={newSite.hostname}
                onChange={(e) => setNewSite({ ...newSite, hostname: e.target.value })}
                placeholder="roanokeasphalt.com"
                className="w-full rounded border border-white/10 bg-[#050810] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                aria-label="Hostname"
              />
              <div className="grid grid-cols-[1fr_5rem] gap-2">
                <input
                  value={newSite.city_target}
                  onChange={(e) => setNewSite({ ...newSite, city_target: e.target.value })}
                  placeholder="Roanoke"
                  className="rounded border border-white/10 bg-[#050810] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  aria-label="Target city"
                />
                <input
                  value={newSite.state_target}
                  onChange={(e) => setNewSite({ ...newSite, state_target: e.target.value })}
                  placeholder="VA"
                  maxLength={2}
                  className="rounded border border-white/10 bg-[#050810] px-3 py-2 text-sm uppercase text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  aria-label="Target state"
                />
              </div>
              {createError && <ErrorNote error={createError} />}
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#050810] hover:bg-amber-400 disabled:opacity-50"
              >
                {creating ? 'Launching…' : 'Launch site'}
              </button>
            </form>
          </Panel>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Panel className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" /> Write a post
              {selectedHost && <span className="text-slate-500 normal-case tracking-normal">for {selectedHost}</span>}
            </h2>

            {!selectedHost ? (
              <p className="text-sm text-slate-500">Select a site first.</p>
            ) : (
              <form onSubmit={submitGenerate} className="space-y-3">
                <input
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="When to sealcoat a commercial lot"
                  className="w-full rounded border border-white/10 bg-[#050810] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  aria-label="Topic"
                />
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="sealcoating, parking lot, roanoke  (comma separated)"
                  className="w-full rounded border border-white/10 bg-[#050810] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  aria-label="Keywords"
                />
                {generateError && <ErrorNote error={generateError} />}
                {lastGenerated && (
                  <div className="flex items-start gap-2 rounded border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-300">
                      Draft saved: “{lastGenerated.title}”. Written by{' '}
                      {lastGenerated.generated_by?.model || 'the content engine'}
                      {lastGenerated.generated_by?.fallback_used ? ' (fallback provider)' : ''}.
                      Review it below before publishing.
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full rounded bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#050810] hover:bg-amber-400 disabled:opacity-50"
                >
                  {generating ? 'Writing…' : 'Write draft'}
                </button>
              </form>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300 mb-4">
              <FileText className="w-4 h-4 text-amber-500" /> Posts
            </h2>

            {posts.length === 0 ? (
              <p className="text-sm text-slate-500">
                {selectedHost ? 'Nothing written for this site yet.' : 'Select a site.'}
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {posts.map((post) => (
                  <li key={post.id} className="py-3 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{post.title}</p>
                      <p className="text-xs text-slate-500 truncate">{post.excerpt}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                        STATUS_STYLES[post.status] || 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      {post.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => review(post.id)}
                      className="shrink-0 text-xs uppercase tracking-[0.08em] text-slate-400 hover:text-amber-500"
                    >
                      Review
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* ── Review drawer ───────────────────────────────────────────────── */}
      {openPost && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:p-10">
          <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-[#0a0f1c]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">
                Review before publishing
              </h3>
              <button
                type="button"
                onClick={() => setOpenPost(null)}
                className="text-xs uppercase tracking-[0.08em] text-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4">
              {openPost.loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : openPost.error ? (
                <ErrorNote error={openPost.error} />
              ) : (
                <>
                  <h4 className="text-xl font-bold text-white mb-1">{openPost.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">/{openPost.slug}</p>
                  <div
                    className="prose prose-invert prose-sm max-w-none text-slate-300"
                    /* The body is HTML from the content engine, rendered so it
                       can be read as it will appear. It is reviewed here by a
                       person precisely because it is machine-written. */
                    dangerouslySetInnerHTML={{ __html: openPost.body || '' }}
                  />

                  {openPost.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => publish(openPost.id)}
                      disabled={publishingId === openPost.id}
                      className="mt-6 flex items-center gap-2 rounded bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#050810] hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {publishingId === openPost.id ? 'Publishing…' : 'Publish to the site'}
                    </button>
                  )}

                  {openPost.status === 'published' && (
                    <p className="mt-6 flex items-center gap-2 text-xs text-emerald-400">
                      <ExternalLink className="w-3.5 h-3.5" /> Live since{' '}
                      {new Date(openPost.published_at).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
