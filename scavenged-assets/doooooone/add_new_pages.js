const fs = require('fs');
const path = require('path');
const glob = require('glob');

const newFiles = [
  'downtown-richmond-driveway-paving.html',
  'fairfax-county-driveway-paving.html',
  'sleepy-hollow-driveway-paving.html',
  'tuckahoe-driveway-paving.html',
  'virginia-beach-driveway-paving.html'
];

const titles = {
  'downtown-richmond-driveway-paving.html': 'Downtown Richmond',
  'fairfax-county-driveway-paving.html': 'Fairfax County',
  'sleepy-hollow-driveway-paving.html': 'Sleepy Hollow',
  'tuckahoe-driveway-paving.html': 'Tuckahoe',
  'virginia-beach-driveway-paving.html': 'Virginia Beach'
};

// 1. Move files
newFiles.forEach(f => {
  if (fs.existsSync('.netlify/assets/' + f)) {
    fs.copyFileSync('.netlify/assets/' + f, f);
    console.log('Copied ' + f);
  }
});

// 2. Add to sitemap.xml
let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
let urlsToAdd = '';
newFiles.forEach(url => {
  if (!sitemap.includes(`<loc>https://jwordenasphaltpaving.com/${url}</loc>`)) {
    urlsToAdd += `  <url>
    <loc>https://jwordenasphaltpaving.com/${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }
});
if (urlsToAdd) {
  sitemap = sitemap.replace('</urlset>', urlsToAdd + '</urlset>');
  fs.writeFileSync('sitemap.xml', sitemap);
  console.log('Updated sitemap');
}

// 3. Add images to new HTML files
const imagesDir = path.join(__dirname, 'assets', 'images');
const images = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

let imgIndex = 0;
newFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('<img ')) {
    const imgHtml = `
    <img src="/assets/images/${images[imgIndex % images.length]}" alt="Driveway Paving ${titles[f]}" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px; margin: 20px 0; border: 2px solid #d4af37;" />
`;
    content = content.replace(/(<\/h1>\s*<p>.*?<\/p>)/s, `$1${imgHtml}`);
    fs.writeFileSync(f, content);
    console.log('Added image to ' + f);
  }
  imgIndex++;
});

// 4. Update links across all HTML files
const htmlFiles = glob.sync('*.html');
const newLinks = newFiles.map(f => `<li><a href="/${f}">${titles[f]}</a></li>`).join('\\n          ');

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add to Service Areas drop
  const dropTarget = '<li><a href="/williamsburg-asphalt-paving.html">Williamsburg VA</a></li>';
  if (content.includes(dropTarget) && !content.includes(newFiles[0])) {
    content = content.split(dropTarget).join(`${dropTarget}
          ${newLinks}`);
    changed = true;
  }

  // Add to All Service Areas list & Footer
  const allTarget = '<li><a href="/richmond-va-paving.html">Richmond VA Paving</a></li>';
  if (content.includes(allTarget) && !content.includes(newFiles[0])) {
    content = content.split(allTarget).join(`${allTarget}
        ${newLinks}`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated links in ' + file);
  }
});
