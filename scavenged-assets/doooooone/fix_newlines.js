const fs = require('fs');
const glob = require('glob');

const files = glob.sync('*.html');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('\\\\n')) {
    content = content.replace(/\\\\n/g, '\\n');
    fs.writeFileSync(f, content);
    console.log('Fixed ' + f);
  }
});
