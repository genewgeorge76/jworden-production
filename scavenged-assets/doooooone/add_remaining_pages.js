const fs = require('fs');
const path = require('path');
const glob = require('glob');

const newFiles = [
  'charlottesville-residential-paving.html',
  'mclean-residential-paving.html'
];

const titles = {
  'charlottesville-residential-paving.html': 'Charlottesville',
  'mclean-residential-paving.html': 'McLean'
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

// 3. Add images to new HTML files if missing
const imagesDir = path.join(__dirname, 'assets', 'images');
const images = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

let imgIndex = 3; // Use a different index
newFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('style="width: 100%; max-width: 800px; height: auto; border-radius: 8px; margin: 20px 0; border: 2px solid #d4af37;"')) {
    const imgHtml = `
    <img src="/assets/images/${images[imgIndex % images.length]}" alt="${titles[f]} Residential Paving" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px; margin: 20px 0; border: 2px solid #d4af37;" />
`;
    
    if (content.match(/(<\/h1>)/s)) {
         content = content.replace(/(<\/h1>)/s, `$1${imgHtml}`);
    }
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

  const target1 = '<li><a href="/virginia-beach-driveway-paving.html">Virginia Beach</a></li>';
  if (content.includes(target1) && !content.includes(newFiles[0])) {
    content = content.split(target1).join(`${target1}
          ${newLinks}`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated links in ' + file);
  }
});
