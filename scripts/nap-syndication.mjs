import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const NAP_FILE = resolve(ROOT, 'src/data/napProfile.json');

// This simulates pushing business information to major aggregator APIs
async function syndicateNAP() {
  console.log('--- JWS Aggressive Local SEO: NAP Syndication ---');
  
  let napData;
  try {
    napData = JSON.parse(readFileSync(NAP_FILE, 'utf8'));
    console.log('[NAP] Loaded source of truth for: ' + napData.businessName);
  } catch (err) {
    console.error('Failed to load NAP file:', err.message);
    process.exit(1);
  }

  const aggregates = [
    { name: 'Bing Places API', endpoint: 'https://api.bingplaces.com/v1/business' },
    { name: 'Yelp Business API', endpoint: 'https://api.yelp.com/v3/businesses' },
    { name: 'Apple Business Connect', endpoint: 'https://businessconnect.apple.com/api/v1/locations' },
    { name: 'BrightLocal / Yext (Mock)', endpoint: 'https://api.brightlocal.com/v1/locations' },
  ];

  console.log('\n[NAP] Synchronizing exact matching NAP data across directories:');
  console.log('   Name: ' + napData.businessName);
  console.log('   Addr: ' + napData.address.street + ', ' + napData.address.city + ', ' + napData.address.state + ' ' + napData.address.zipCode);
  console.log('   Phone: ' + napData.phone);
  
  for (const aggregator of aggregates) {
    console.log('\n-> Syncing with ' + aggregator.name + '...');
    const payload = {
      name: napData.businessName,
      address: napData.address,
      phone: napData.phone,
      categories: napData.categories,
      hours: napData.hours
    };

    // Simulated API call block
    const mockRequest = new Promise((resolve) => setTimeout(resolve, 800));
    await mockRequest;
    
    console.log('   [OK] Successfully overwrote mismatched listings on ' + aggregator.name);
    console.log('   [+] Data pushed: ' + JSON.stringify(payload).substring(0, 70) + '...');
  }
}

syndicateNAP();
