import fs from 'fs';
import path from 'path';

function findPhotos(dir) {
  let list = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      list = list.concat(findPhotos(full));
    } else if (f.match(/\.(jpg|jpeg|png|webp|JPG|PNG)$/) && stat.size > 50000) {
      list.push({
        path: '/' + path.relative('./public', full).replace(/\\/g, '/'),
        sizeKb: Math.round(stat.size / 1024),
        name: f
      });
    }
  }
  return list;
}

const photos = findPhotos('./public/images/real_jobs')
  .concat(findPhotos('./public/work/portfolio'))
  .concat(findPhotos('./public/work/kfc'))
  .concat(findPhotos('./public/images/kfc'));

console.log(JSON.stringify(photos.slice(0, 40), null, 2));
