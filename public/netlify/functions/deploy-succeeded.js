/**
 * Netlify Function: deploy-succeeded
 * Automatically runs after every successful site deployment.
 * Notifies Google and Bing that the sitemap has been updated.
 */

exports.handler = async (event, context) => {
  console.log('Deploy succeeded! Notifying search engines of sitemap update...');
  
  const siteUrl = 'https://jwordenasphaltpaving.com';
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  const results = [];

  // 1. Google Search Console API (Requires GOOGLE_SEARCH_CONSOLE_API_KEY)
  if (process.env.GOOGLE_SEARCH_CONSOLE_API_KEY) {
    try {
      const googleApiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/submitSitemap?key=${process.env.GOOGLE_SEARCH_CONSOLE_API_KEY}`;
      const response = await fetch(googleApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemapUrl })
      });
      results.push(`Google Search Console API: ${response.status} ${response.statusText}`);
    } catch (error) {
      results.push(`Google Search Console API Error: ${error.message}`);
    }
  } else {
    results.push('Google Search Console API: Skipped (Missing GOOGLE_SEARCH_CONSOLE_API_KEY)');
  }

  // 2. Bing Webmaster API (Requires BING_WEBMASTER_API_KEY)
  if (process.env.BING_WEBMASTER_API_KEY) {
    try {
      const bingApiUrl = `https://www.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${process.env.BING_WEBMASTER_API_KEY}`;
      const response = await fetch(bingApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: siteUrl,
          urlList: [sitemapUrl]
        })
      });
      results.push(`Bing Webmaster API: ${response.status} ${response.statusText}`);
    } catch (error) {
      results.push(`Bing Webmaster API Error: ${error.message}`);
    }
  } else {
    results.push('Bing Webmaster API: Skipped (Missing BING_WEBMASTER_API_KEY)');
  }

  // 3. Public Ping Endpoints (Deprecated but still widely used for notification)
  const publicPings = [
    { name: 'Google Ping', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    { name: 'Bing Ping', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` }
  ];

  for (const ping of publicPings) {
    try {
      const response = await fetch(ping.url);
      results.push(`${ping.name}: ${response.status} ${response.statusText}`);
    } catch (error) {
      results.push(`${ping.name} Error: ${error.message}`);
    }
  }

  console.log('Search engine notification summary:', results);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Sitemap notification process completed',
      results
    })
  };
};
