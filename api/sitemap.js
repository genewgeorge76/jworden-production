import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const host = req.headers['host'] || 'www.jwordenasphaltpaving.com';
  
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  let xml = fs.readFileSync(sitemapPath, 'utf8');
  
  // Replace the default site URL with the current host dynamically
  xml = xml.replace(/https:\/\/www\.jwordenasphaltpaving\.com/g, `https://${host}`);
  xml = xml.replace(/https:\/\/jwordenasphaltpaving\.com/g, `https://${host}`);
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
}
