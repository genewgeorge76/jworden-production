import fs from 'fs';
import path from 'path';

function checkJsxFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const matches = code.match(/['"`](\/[^'"`]+\.(jpg|jpeg|png|webp|JPG|PNG))['"`]/g) || [];
  for (const m of matches) {
    const clean = m.slice(1, -1);
    const local = path.join('./public', clean);
    if (!fs.existsSync(local)) {
      console.log('MISSING IMAGE:', file, '->', clean);
    } else {
      const size = fs.statSync(local).size;
      if (size < 1000) {
        console.log('ZERO/EMPTY IMAGE:', file, '->', clean, `(${size} bytes)`);
      }
    }
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scanDir(full);
    else if (f.endsWith('.jsx')) checkJsxFile(full);
  }
}

scanDir('./src/components');
scanDir('./src/pages');
