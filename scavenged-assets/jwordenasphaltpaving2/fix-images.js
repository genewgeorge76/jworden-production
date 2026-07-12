const fs = require('fs');
const glob = require('glob'); // Note: we can use fs.readdirSync if glob is missing, but glob might be available or we can just iterate.

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace src="images/..." in img tags
  const srcRegex = /<img[^>]*src=["'](images\/[^"']+)["'][^>]*>/g;
  content = content.replace(srcRegex, (match, p1) => {
    changed = true;
    return match.replace(p1, `/.netlify/images?url=/${p1}`);
  });

  // Replace href="images/..." in link preload tags
  const hrefRegex = /<link[^>]*rel=["']preload["'][^>]*href=["'](images\/[^"']+)["'][^>]*>/g;
  content = content.replace(hrefRegex, (match, p1) => {
    changed = true;
    return match.replace(p1, `/.netlify/images?url=/${p1}`);
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
