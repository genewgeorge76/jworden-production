const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'assets', 'images');
const images = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

let imgIndex = 0;

for (const file of htmlFiles) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/https:\/\/images\.unsplash\.com\/[^"]+/g, () => {
    const replacement = `assets/images/${images[imgIndex]}`;
    imgIndex = (imgIndex + 1) % images.length;
    return replacement;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Replacement complete.');
