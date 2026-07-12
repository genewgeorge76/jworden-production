const fs = require('fs');

// 1. Update sitemap.xml
let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const newUrls = [
  'residential-asphalt-paving.html',
  'driveway-paving.html',
  'commercial-paving.html'
];
let urlsToAdd = '';
for (const url of newUrls) {
  if (!sitemap.includes(`<loc>https://jwordenasphaltpaving.com/${url}</loc>`)) {
    urlsToAdd += `  <url>\n    <loc>https://jwordenasphaltpaving.com/${url}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
}
if (urlsToAdd) {
  sitemap = sitemap.replace('</urlset>', urlsToAdd + '</urlset>');
  fs.writeFileSync('sitemap.xml', sitemap);
}

// 2. Add images to the new HTML files
const pages = [
  { file: 'residential-asphalt-paving.html', img: '/assets/images/20180209_022434599_iOS.jpg', alt: 'Residential Asphalt Paving' },
  { file: 'driveway-paving.html', img: '/assets/images/20170522_015146267_iOS.jpg', alt: 'Driveway Paving' },
  { file: 'commercial-paving.html', img: '/assets/images/20210623_130503705_iOS.jpg', alt: 'Commercial Paving' }
];

for (const page of pages) {
  let content = fs.readFileSync(page.file, 'utf8');
  // Add image right after the first paragraph or h1 if not already there
  if (!content.includes('<img ')) {
    const imgHtml = `\n    <img src="${page.img}" alt="${page.alt}" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px; margin: 20px 0; border: 2px solid #d4af37;" />\n`;
    content = content.replace(/(<\/h1>\s*<p>.*?<\/p>)/s, `$1${imgHtml}`);
    fs.writeFileSync(page.file, content);
  }
}

console.log('Site updated');
