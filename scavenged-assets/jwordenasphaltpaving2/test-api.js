const fetch = require('node-fetch');
async function run() {
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ custom_domain: 'jwordenasphaltpaving.com' })
  });
  const data = await res.json();
  console.log(res.status, data);
}
run();
