import fs from 'node:fs';
import path from 'node:path';

const domains = [
    "jwordenasphaltpaving.com",
    "jwordenandsonspaving.com",
    "jwordenasphaltpaving.pro",
    "atlantaasphaltpavingpros.com",
    "minnesotaasphaltpaving.com",
    "asphaltpavingkansascity.com",
    "richmondasphaltpaving.net",
    "richmondasphaltpros.com",
    "savannahpaving.com",
    "atlantapavingandsealing.com",
    "richmondasphaltpaving.com",
    "carolinablacktop.com",
    "thewordenstandard.com"
];

const SITEMAP_PATH = path.resolve('public/sitemap.xml');
const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');

for (const domain of domains) {
    // Generate URL list by replacing the default domain with the current one
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((m) => m[1].trim().replace('www.jwordenasphaltpaving.com', domain).replace('jwordenasphaltpaving.com', domain));

    const body = {
        host: domain,
        key: '3ef8a81ce186414ca3235bebb5072f22',
        keyLocation: `https://${domain}/3ef8a81ce186414ca3235bebb5072f22.txt`,
        urlList: urls,
    };

    console.log(`Submitting ${urls.length} URLs for ${domain} to IndexNow...`);
    
    try {
        const res = await fetch('https://api.indexnow.org/IndexNow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(body),
        });
        const txt = await res.text();
        if (res.ok || res.status === 202) {
            console.log(`  -> Success (HTTP ${res.status})`);
        } else {
            console.log(`  -> Failed (HTTP ${res.status}): ${txt.slice(0, 200)}`);
        }
    } catch (e) {
        console.log(`  -> Network error: ${e.message}`);
    }
}
