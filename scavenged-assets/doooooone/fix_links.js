const fs = require('fs');
const glob = require('glob');

const files = glob.sync('*.html');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern 1: Asphalt Driveway Paving
  const drivewayPattern = '<li><a href="/asphalt-driveway-paving.html">Asphalt Driveway Paving</a></li>';
  const newDrivewayLinks = `<li><a href="/asphalt-driveway-paving.html">Asphalt Driveway Paving</a></li>\n          <li><a href="/residential-asphalt-paving.html">Residential Asphalt Paving</a></li>\n          <li><a href="/driveway-paving.html">Driveway Paving</a></li>`;
  
  if (content.includes(drivewayPattern)) {
    // Only replace if not already added
    if (!content.includes('residential-asphalt-paving.html')) {
        // We use split and join to replace all occurrences
        content = content.split(drivewayPattern).join(newDrivewayLinks);
        changed = true;
    }
  }

  // Pattern 2: Parking Lot Paving
  const parkingPattern = '<li><a href="/parking-lot-paving.html">Parking Lot Paving</a></li>';
  const newParkingLinks = `<li><a href="/parking-lot-paving.html">Parking Lot Paving</a></li>\n          <li><a href="/commercial-paving.html">Commercial Paving</a></li>`;
  
  if (content.includes(parkingPattern)) {
    if (!content.includes('commercial-paving.html')) {
        content = content.split(parkingPattern).join(newParkingLinks);
        changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated links in ${file}`);
  }
});
