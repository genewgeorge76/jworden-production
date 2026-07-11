export default function handler(req, res) {
  const host = req.headers['host'] || 'www.jwordenasphaltpaving.com';
  
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  const robots = `User-agent: *
Allow: /

# Block back-office & admin routes (not for public indexing)
Disallow: /command-center
Disallow: /dashboard
Disallow: /consultant
Disallow: /job
Disallow: /crew-reporting
Disallow: /dns-migration
Disallow: /portal
Disallow: /admin
Disallow: /admin/
Disallow: /leads
Disallow: /voice-calls
Disallow: /revenue

# Block internal strategy/tooling routes
Disallow: /home-services
Disallow: /contractor-ai
Disallow: /advisory

# Block URL parameters that create duplicate content
Disallow: /*?gclid=
Disallow: /*?utm_
Disallow: /*?fbclid=

# Crawl-delay for aggressive bots
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

# Explicitly allow major AI search crawlers
User-agent: Googlebot
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

# Dynamically link the correct sitemap for the current domain
Sitemap: https://${host}/sitemap.xml
`;

  res.status(200).send(robots);
}
