const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'content', 'insights');
const files = fs.readdirSync(dir);

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

files.forEach(f => {
  if (f.endsWith('.md')) {
    const fp = path.join(dir, f);
    let c = fs.readFileSync(fp, 'utf-8');
    const rd = randomDate(new Date(2022, 0, 1), new Date(2024, 4, 1)).toISOString();
    c = c.replace(/date: '.*'/, `date: '${rd}'`);
    fs.writeFileSync(fp, c, 'utf-8');
  }
});
console.log('Dates randomized successfully');
