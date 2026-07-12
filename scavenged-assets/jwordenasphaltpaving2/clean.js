const fs = require('fs');
const path = require('path');

const srcPath = path.join('.netlify', 'assets', 'Asphalt Paving Richmond VA _ J. Worden & Sons _ (804) 446-1296 file needed.html');
const destPath = 'index.html';

let content = fs.readFileSync(srcPath, 'utf8');

// Remove "saved from url" comment
content = content.replace(/<!-- saved from url=.*?-->\n?/g, '');

// Fix domain
content = content.replace(/https:\/\/agent-[a-zA-Z0-9\-]+--productionjwordenfinal\.netlify\.app\//g, '/');
content = content.replace(/https:\/\/agent-[a-zA-Z0-9\-]+-%2Dproductionjwordenfinal\.netlify\.app\//g, '/');

// Fix internal link extensions if needed. 
// e.g. href="/asphalt-driveway-paving" -> href="/asphalt-driveway-paving.html"
const pages = [
  'asphalt-driveway-paving',
  'parking-lot-paving',
  'sealcoating',
  'asphalt-repair',
  'grading-excavation',
  'line-striping',
  'chip-and-tar',
  'cobblestone-paving',
  'concrete-paving',
  'stone-masonry-paving',
  'chesterfield-paving',
  'chester-va-paving',
  'richmond-va-paving',
  'midlothian-asphalt-paving',
  'mechanicsville-asphalt-paving',
  'henrico-va-paving'
];

for (const page of pages) {
  const regex = new RegExp(`href="/${page}"`, 'g');
  content = content.replace(regex, `href="/${page}.html"`);
}

// Remove injected extension code
const c4gIndex = content.indexOf('<div id="c4g-content-root" class="c4g-widget">');
if (c4gIndex !== -1) {
  content = content.substring(0, c4gIndex);
  content += '</body>\n</html>\n';
}

fs.writeFileSync(destPath, content, 'utf8');
console.log('Cleaned and updated index.html');
