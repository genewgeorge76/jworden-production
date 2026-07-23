exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL parameter required' })
      };
    }

    if (!url.startsWith('https://')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Full HTTPS URL required' })
      };
    }

    const results = await Promise.allSettled([
      pingGoogle(url),
      pingBing(url)
    ]);

    const [googleResult, bingResult] = results;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Search engines notified',
        url,
        google: googleResult.status === 'fulfilled' ? googleResult.value : { error: googleResult.reason?.message },
        bing: bingResult.status === 'fulfilled' ? bingResult.value : { error: bingResult.reason?.message }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function pingGoogle(url) {
  const apiKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!apiKey) {
    return { status: 'skipped', reason: 'GOOGLE_SEARCH_CONSOLE_API_KEY not configured' };
  }

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fjwordenasphaltpaving.com/submitSitemap?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitemapUrl: url })
    }
  );

  return {
    status: response.ok ? 'success' : 'failed',
    statusCode: response.status,
    message: response.statusText
  };
}

async function pingBing(url) {
  const apiKey = process.env.BING_WEBMASTER_API_KEY;
  if (!apiKey) {
    return { status: 'skipped', reason: 'BING_WEBMASTER_API_KEY not configured' };
  }

  const response = await fetch(
    `https://www.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://jwordenasphaltpaving.com',
        urlList: [url]
      })
    }
  );

  const data = await response.json();
  return {
    status: response.ok ? 'success' : 'failed',
    statusCode: response.status,
    message: response.statusText,
    bingResponse: data
  };
}
