import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';

/**
 * Facebook Page management for the Command Center.
 *
 * The backend returns { configured: false, missing: [...] } when the Page
 * credentials are unset, and 501 on publish rather than reporting a post that
 * never reached Facebook. This panel surfaces both states literally — an empty
 * feed and an unreachable Page must never look the same.
 */

const PAGE_URL = 'https://www.facebook.com/jwordenpaving';
const MAX_LEN = 63206;

function relative(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  // Clamp: a Page timestamp can sit slightly in the future through clock
  // skew, and "-3m ago" is worse than "0m ago".
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default function FacebookPanel() {
  const [status, setStatus] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postsError, setPostsError] = useState(null);

  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPostsError(null);
    // Settled, not all: a failed posts fetch must not be collapsed into an
    // empty feed. "No posts" and "we could not ask" are different facts and
    // the panel exists to keep them apart.
    const [statusRes, postsRes] = await Promise.allSettled([
      api.getFacebookStatus(),
      api.getFacebookPosts(15),
    ]);

    if (statusRes.status === 'fulfilled') {
      setStatus(statusRes.value);
    } else {
      setError(statusRes.reason?.message || 'Could not reach the backend.');
    }

    if (postsRes.status === 'fulfilled') {
      const p = postsRes.value;
      setPosts(p?.posts || []);
      if (p && p.configured && !p.connected && p.detail) setPostsError(p.detail);
    } else {
      // Leave any previously loaded posts alone rather than blanking the feed.
      setPostsError(postsRes.reason?.message || 'Could not load posts.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const publish = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setPublishing(true);
    setNotice(null);
    try {
      const res = await api.publishFacebookPost(text, link.trim() || undefined);
      setNotice({ kind: 'ok', text: `Published. Post ID ${res.id}` });
      setMessage('');
      setLink('');
      load();
    } catch (err) {
      setNotice({ kind: 'err', text: err?.message || 'Publish failed.' });
    } finally {
      setPublishing(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this post from the Facebook Page? This cannot be undone.')) return;
    try {
      await api.deleteFacebookPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setNotice({ kind: 'err', text: err?.message || 'Delete failed.' });
    }
  };

  const notConfigured = status && status.configured === false;
  const notConnected = status && status.configured && status.connected === false;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Facebook Page</h3>
          <a href={PAGE_URL} target="_blank" rel="noreferrer" className="text-xs text-sky-400 hover:underline">
            facebook.com/jwordenpaving
          </a>
        </div>
        <div className="flex items-center gap-3">
          {status?.page?.followers != null && (
            <span className="text-xs text-zinc-400">{status.page.followers.toLocaleString()} followers</span>
          )}
          <button onClick={load} disabled={loading}
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 disabled:opacity-50">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Setup state — the common case today */}
      {notConfigured && (
        <div className="rounded-lg border border-amber-900 bg-amber-950/30 p-4">
          <p className="text-sm font-semibold text-amber-200">Not connected yet</p>
          <p className="mt-1 text-xs text-amber-300/90">{status.detail}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-amber-300/80">
            {(status.missing || []).map((m) => <li key={m}><code>{m}</code></li>)}
          </ul>
          <p className="mt-2 text-[11px] text-amber-300/70">
            Create a Meta app at developers.facebook.com, grant it{' '}
            <code>pages_manage_posts</code> and <code>pages_read_engagement</code>, then generate a
            long-lived Page access token.
          </p>
        </div>
      )}

      {notConnected && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4">
          <p className="text-sm font-semibold text-red-200">Facebook rejected the request</p>
          <p className="mt-1 text-xs text-red-300/90">{status.detail}</p>
        </div>
      )}

      {error && !notConfigured && (
        <p className="rounded border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      {/* Composer */}
      <form onSubmit={publish} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <label htmlFor="fb-new-post" className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
          New post
        </label>
        <textarea
          id="fb-new-post"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
          rows={4}
          placeholder="Write a post for the Page…"
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none"
        />
        <label htmlFor="fb-post-link" className="sr-only">Optional link to attach</label>
        <input
          id="fb-post-link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Optional link to attach (https://…)"
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-600">{message.length.toLocaleString()} characters</span>
          <button type="submit" disabled={publishing || !message.trim()}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40">
            {publishing ? 'Publishing…' : 'Publish to Page'}
          </button>
        </div>
        {notice && (
          <p className={`mt-2 text-xs ${notice.kind === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {notice.text}
          </p>
        )}
      </form>

      {/* Feed */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-4 py-2 text-xs uppercase tracking-wider text-zinc-500">
          Published posts {posts.length > 0 && `(${posts.length})`}
        </div>

        {loading && <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>}

        {/* A failed fetch is reported as a failure, never as an empty Page. */}
        {!loading && postsError && (
          <p className="border-b border-zinc-800 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            Could not load posts — {postsError}. This is a request failure, not an
            empty Page: no conclusion should be drawn about what is published.
          </p>
        )}

        {!loading && !postsError && posts.length === 0 && !notConfigured && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            The Page responded and returned no published posts.
          </p>
        )}

        {!loading && posts.map((p) => (
          <article key={p.id} className="border-b border-zinc-800/60 px-4 py-3 last:border-0">
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-sm text-zinc-200">{p.message || <em className="text-zinc-500">No text</em>}</p>
              <button onClick={() => remove(p.id)}
                className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:border-red-700 hover:text-red-400">
                Delete
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
              <span>{relative(p.created_time)}</span>
              {p.likes != null && <span>{p.likes} likes</span>}
              {p.comments != null && <span>{p.comments} comments</span>}
              {p.shares > 0 && <span>{p.shares} shares</span>}
              {p.permalink && (
                <a href={p.permalink} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                  View on Facebook
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
