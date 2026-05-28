import { useEffect } from 'react';
import { PRIMARY_DOMAIN } from '@/lib/locations';
import { resolveSiteProfile } from '@/lib/siteProfiles';

/**
 * SEO — comprehensive document head manager implementing Google's 2026 best practices.
 * Sets title, description, canonical URL, Open Graph, Twitter, robots, geo, hreflang,
 * and JSON-LD structured data.
 */
export default function SEO({
  title,
  description,
  canonicalPath,
  ogImage = '/hero-paving.jpg',
  ogType = 'website',
  jsonLd,
  noindex = false,
  publishedTime,
  modifiedTime,
  geo,
}) {
  useEffect(() => {
    if (title) document.title = title;

    const setMeta = (selector, attr, value) => {
      if (value === undefined || value === null || value === '') return;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [, key, val] = selector.match(/\[(.+?)="(.+?)"\]/) || [];
        if (key && val) el.setAttribute(key, val);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const currentHostname =
      typeof window !== 'undefined' ? String(window.location.hostname || '').toLowerCase() : '';
    const siteProfile = resolveSiteProfile(currentHostname);
    const isOperationsDomain =
      currentHostname.includes('thewordenstandard.com') ||
      currentHostname.includes('thewrodenstandard.com');

    const rawPath = canonicalPath || currentPath || '/';
    const pathOnly = String(rawPath).split('?')[0].split('#')[0] || '/';
    const normalizedPath = pathOnly !== '/' ? pathOnly.replace(/\/+$/, '') : '/';
    const canonicalBase =
      isOperationsDomain && typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : siteProfile?.canonicalUrl || PRIMARY_DOMAIN;
    const canonicalUrl = `${canonicalBase}${normalizedPath}`;
    const siteName = siteProfile?.label || 'J. Worden & Sons Paving LLC';

    const isInternalRoute = [
      '/command-center',
      '/dashboard',
      '/consultant',
      '/job',
      '/crew-reporting',
      '/dns-migration',
      '/portal',
      '/admin',
      '/leads',
      '/voice-calls',
      '/revenue',
      '/residential',
      '/home-services',
      '/general-contracting',
      '/tar-and-chip',
      '/contractor-ai',
      '/advisory',
    ].some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
    const shouldNoindex = Boolean(noindex || isInternalRoute || isOperationsDomain);

    // Description
    if (description) setMeta('meta[name="description"]', 'content', description);

    // Robots directive — critical for controlling indexing
    setMeta(
      'meta[name="robots"]',
      'content',
      shouldNoindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    // Googlebot-specific (redundant but Google's official recommendation)
    setMeta(
      'meta[name="googlebot"]',
      'content',
      shouldNoindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // Canonical link — always points to primary domain
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // hreflang — self-referencing for US English (Google best practice for local business)
    let hreflang = document.head.querySelector('link[rel="alternate"][hreflang="en-US"]');
    if (!hreflang) {
      hreflang = document.createElement('link');
      hreflang.setAttribute('rel', 'alternate');
      hreflang.setAttribute('hreflang', 'en-US');
      document.head.appendChild(hreflang);
    }
    hreflang.setAttribute('href', canonicalUrl);

    let xDefault = document.head.querySelector('link[rel="alternate"][hreflang="x-default"]');
    if (!xDefault) {
      xDefault = document.createElement('link');
      xDefault.setAttribute('rel', 'alternate');
      xDefault.setAttribute('hreflang', 'x-default');
      document.head.appendChild(xDefault);
    }
    xDefault.setAttribute('href', canonicalUrl);

    // Open Graph
    setMeta('meta[property="og:title"]', 'content', title || '');
    setMeta('meta[property="og:description"]', 'content', description || '');
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:image"]', 'content', ogImage);
    setMeta('meta[property="og:image:width"]', 'content', '1200');
    setMeta('meta[property="og:image:height"]', 'content', '630');
    setMeta('meta[property="og:image:alt"]', 'content', title || siteName);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[property="og:site_name"]', 'content', siteName);
    setMeta('meta[property="og:locale"]', 'content', 'en_US');

    // Article-specific OG tags (for blog posts)
    if (publishedTime) setMeta('meta[property="article:published_time"]', 'content', publishedTime);
    if (modifiedTime) setMeta('meta[property="article:modified_time"]', 'content', modifiedTime);

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title || '');
    setMeta('meta[name="twitter:description"]', 'content', description || '');
    setMeta('meta[name="twitter:image"]', 'content', ogImage);
    setMeta('meta[name="twitter:image:alt"]', 'content', title || siteName);

    // Geo tags — defaults to Virginia but can be overridden per-site/page.
    const geoDefaults = {
      region: 'US-VA',
      placename: 'Chester, Virginia',
      position: '37.3563;-77.4411',
      icbm: '37.3563, -77.4411',
    };
    const geoMeta = {
      ...geoDefaults,
      ...(geo || {}),
    };
    setMeta('meta[name="geo.region"]', 'content', geoMeta.region);
    setMeta('meta[name="geo.placename"]', 'content', geoMeta.placename);
    setMeta('meta[name="geo.position"]', 'content', geoMeta.position);
    setMeta('meta[name="ICBM"]', 'content', geoMeta.icbm);

    // JSON-LD structured data — remove old, add new
    const existingLd = document.head.querySelector('script[data-seo-jsonld="true"]');
    if (existingLd) existingLd.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, ogImage, ogType, jsonLd, noindex, publishedTime, modifiedTime, geo]);

  return null;
}
