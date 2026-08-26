// Unit tests for middleware.js — host-based routing for the multi-domain
// money sites.
//
// This middleware sits in front of every homepage request on every revenue
// domain, so a regression here is a direct revenue/SEO incident: the failure
// mode it exists to prevent (regional domains serving the generic page with a
// canonical pointing at a different site) is silent and looks fine in a
// browser. These tests exist so that adding a domain, changing the www
// handling, or renaming a prebuilt page can't quietly reopen that hole.
//
// Deliberately dependency-free (node:test + node:assert) — vitest is not
// installed in this project and this needs to run in CI without adding one.

import test from 'node:test';
import assert from 'node:assert/strict';
import middleware, { config } from '../../middleware.js';

/** Run the middleware and describe what it decided, in plain terms. */
function decide(url, hostHeader) {
  const res = middleware(new Request(url, { headers: { host: hostHeader } }));
  const rewriteTo = res.headers.get('x-middleware-rewrite');
  if (rewriteTo) return { action: 'rewrite', to: new URL(rewriteTo, url).pathname };
  if (res.headers.get('x-middleware-next')) return { action: 'next' };
  return { action: 'other', status: res.status };
}

const REGIONALS = [
  'richmondasphaltpaving.com',
  'carolinablacktop.com',
  'atlantaasphaltpavingpros.com',
  'asphaltpavingkansascity.com',
  'savannahasphaltpaving.com',
];

test('matcher still covers the static files that shadow host rewrites', () => {
  // These four (plus /) are the paths that exist as real files in the build
  // output, so Vercel serves them before consulting vercel.json host rules.
  // They must stay explicitly listed: the catch-all pattern added for soft-404
  // handling excludes anything containing a dot, which is all of them.
  for (const p of ['/', '/index.html', '/robots.txt', '/sitemap.xml', '/sitemap.txt']) {
    assert.ok(config.matcher.includes(p), `${p} dropped from matcher`);
  }
});

test('matcher also sees extensionless paths, for soft-404 handling', () => {
  const catchAll = config.matcher.find((m) => m.includes('(?!'));
  assert.ok(catchAll, 'no catch-all pattern — unknown URLs would still return 200');
  // Static assets must not pay for a middleware invocation on every request.
  for (const excluded of ['api/', 'assets/', '_vercel/']) {
    assert.ok(catchAll.includes(excluded), `${excluded} should be excluded from the matcher`);
  }
  assert.ok(catchAll.includes('\\.'), 'file-like paths should be excluded from the matcher');
});

test('each regional domain gets its own homepage, bare and www', () => {
  for (const domain of REGIONALS) {
    assert.deepEqual(
      decide(`https://${domain}/`, domain),
      { action: 'rewrite', to: `/${domain}.html` },
      `${domain} homepage`,
    );
    assert.deepEqual(
      decide(`https://www.${domain}/`, `www.${domain}`),
      { action: 'rewrite', to: `/${domain}.html` },
      `www.${domain} homepage`,
    );
  }
});

test('/index.html is treated exactly like / (no duplicate-content back door)', () => {
  for (const domain of REGIONALS) {
    assert.deepEqual(
      decide(`https://${domain}/index.html`, domain),
      { action: 'rewrite', to: `/${domain}.html` },
      `${domain}/index.html`,
    );
  }
});

test('the ops dashboard host gets its own page', () => {
  assert.deepEqual(
    decide('https://thewordenstandard.com/', 'thewordenstandard.com'),
    { action: 'rewrite', to: '/thewordenstandard.com.html' },
  );
});

test('main site and apex are left alone — index.html is already correct for them', () => {
  assert.deepEqual(
    decide('https://www.jwordenasphaltpaving.com/', 'www.jwordenasphaltpaving.com'),
    { action: 'next' },
  );
  assert.deepEqual(
    decide('https://jwordenasphaltpaving.com/', 'jwordenasphaltpaving.com'),
    { action: 'next' },
  );
});

test('SaaS tenant subdomains still fall through to the SPA', () => {
  // *.thewordenstandard.com is routed to /index.html by vercel.json so the
  // client-side tenant resolver can run. Middleware must not intercept it.
  for (const host of ['acme.thewordenstandard.com', 'a-b-c.thewordenstandard.com']) {
    assert.deepEqual(decide(`https://${host}/`, host), { action: 'next' }, host);
  }
});

test('unknown hosts are never rewritten', () => {
  for (const path of ['/', '/index.html', '/robots.txt', '/sitemap.xml']) {
    assert.deepEqual(
      decide(`https://some-unrelated-domain.com${path}`, 'some-unrelated-domain.com'),
      { action: 'next' },
      `unknown host ${path}`,
    );
  }
});

test('robots and sitemaps resolve per-domain, honouring the differing www convention', () => {
  // The main site's files are named with the www. prefix; the regionals' are
  // not. Getting this backwards serves an HTML page in place of robots.txt.
  assert.deepEqual(
    decide('https://richmondasphaltpaving.com/robots.txt', 'richmondasphaltpaving.com'),
    { action: 'rewrite', to: '/sitemaps/robots-richmondasphaltpaving.com.txt' },
  );
  assert.deepEqual(
    decide('https://www.richmondasphaltpaving.com/robots.txt', 'www.richmondasphaltpaving.com'),
    { action: 'rewrite', to: '/sitemaps/robots-richmondasphaltpaving.com.txt' },
  );
  assert.deepEqual(
    decide('https://www.jwordenasphaltpaving.com/robots.txt', 'www.jwordenasphaltpaving.com'),
    { action: 'rewrite', to: '/sitemaps/robots-www.jwordenasphaltpaving.com.txt' },
  );
  assert.deepEqual(
    decide('https://carolinablacktop.com/sitemap.xml', 'carolinablacktop.com'),
    { action: 'rewrite', to: '/sitemaps/sitemap-carolinablacktop.com.xml' },
  );
  assert.deepEqual(
    decide('https://carolinablacktop.com/sitemap.txt', 'carolinablacktop.com'),
    { action: 'rewrite', to: '/sitemaps/sitemap-carolinablacktop.com.txt' },
  );
});

test('jwordenuniversity.com serves its own sitemap, not the flagship one', () => {
  // Regression: this host was absent from SITEMAP_HOSTS, so middleware fell
  // through to next() and Vercel served the static public/sitemap.xml — 265
  // URLs, all on www.jwordenasphaltpaving.com, which is currently a parked
  // domain. A live site was advertising 265 dead URLs on another host.
  assert.deepEqual(
    decide('https://jwordenuniversity.com/sitemap.xml', 'jwordenuniversity.com'),
    { action: 'rewrite', to: '/sitemaps/sitemap-jwordenuniversity.com.xml' },
  );
  assert.deepEqual(
    decide('https://www.jwordenuniversity.com/sitemap.xml', 'www.jwordenuniversity.com'),
    { action: 'rewrite', to: '/sitemaps/sitemap-jwordenuniversity.com.xml' },
  );
  assert.deepEqual(
    decide('https://jwordenuniversity.com/robots.txt', 'jwordenuniversity.com'),
    { action: 'rewrite', to: '/sitemaps/robots-jwordenuniversity.com.txt' },
  );
});

test('jwordenuniversity.com homepage is NOT rewritten to a prebuilt HTML file', () => {
  // It has no jwordenuniversity.com.html; the homepage is the SPA's UNIVERSITY
  // route mode. Adding it to HOMEPAGE_BY_HOST would 404 the homepage.
  const d = decide('https://jwordenuniversity.com/', 'jwordenuniversity.com');
  assert.notEqual(d.action, 'rewrite', 'homepage must not rewrite to a missing file');
});

test('host header is normalised (port, casing)', () => {
  assert.deepEqual(
    decide('https://richmondasphaltpaving.com/', 'RichmondAsphaltPaving.com:443'),
    { action: 'rewrite', to: '/richmondasphaltpaving.com.html' },
  );
});

test('a missing Host header falls back to the request URL hostname', () => {
  // Vercel always supplies Host in production, but the fallback must be
  // sane rather than throwing: the URL hostname is the correct answer.
  const res = middleware(new Request('https://richmondasphaltpaving.com/'));
  assert.equal(
    new URL(res.headers.get('x-middleware-rewrite'), 'https://richmondasphaltpaving.com').pathname,
    '/richmondasphaltpaving.com.html',
  );
});

test('a garbage Host value passes through instead of throwing', () => {
  for (const bad of ['', '   ', '::::', 'not a host at all']) {
    const res = middleware(
      new Request('https://example.invalid/', { headers: { host: bad } }),
    );
    assert.ok(
      res.headers.get('x-middleware-next'),
      `garbage host ${JSON.stringify(bad)} must pass through`,
    );
  }
});
