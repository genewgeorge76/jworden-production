import requests, json

import os

# The token was hardcoded here and committed. A Netlify personal access
# token is full control of the account: DNS zones, site deploys, and the
# domains it serves. Read access to this repository was enough to use it.
#
# Removing the literal does not undo that — it remains in git history — so
# the token must be REVOKED in the Netlify account and reissued.
NETLIFY_TOKEN = os.environ["NETLIFY_AUTH_TOKEN"]
VERCEL_IP     = "76.76.21.21"
VERCEL_CNAME  = "cname.vercel-dns.com"

ZONES = {
    "jwordenasphaltpaving.com":    "69a506f58f71a3a9cdcbf1ff",
    "jwordenandsonspaving.com":    "69a0eabe5f6a9758e0b49b73",
    "jwordenasphaltpaving.pro":    "69adb5547071717e80f8969f",
    "atlantaasphaltpavingpros.com":"6a0a613b8952a5f324c32b4e",
    "minnesotaasphaltpaving.com":  "6a028c613324583aa2b48347",
    "asphaltpavingkansascity.com": "69df0e4ed169df38352fae0e",
    "richmondasphaltpaving.net":   "69df0e16159d093e3f726184",
    "richmondasphaltpros.com":     "69df0dd2bbae4a1d5ad6db80",
    "savannahpaving.com":          "69df0b849e6db122dde49fe7",
    "atlantapavingandsealing.com": "69df0b4d658a513197f3cbfd",
    "richmondasphaltpaving.com":   "69df0b00f38d03047959aed4",
    "carolinablacktop.com":        "69df0a712840d61fd0f1e3a8",
    "thewordenstandard.com":       "69df0a02a61f4c30124e1245",
}

h = {"Authorization": f"Bearer {NETLIFY_TOKEN}", "Content-Type": "application/json"}
BASE = "https://api.netlify.com/api/v1"

print("=== Updating ALL Netlify DNS zones -> Vercel ===\n")

for domain, zone_id in ZONES.items():
    print(f"--- {domain} ---")
    
    # Get existing records
    r = requests.get(f"{BASE}/dns_zones/{zone_id}/dns_records", headers=h)
    records = r.json() if r.ok else []
    
    if isinstance(records, list):
        # Delete all Netlify-managed and old A records
        for rec in records:
            rtype = rec.get("type","")
            rhost = rec.get("hostname","")
            rval  = rec.get("value","")
            rid   = rec.get("id","")
            should_delete = (
                rtype in ("NETLIFY","NETLIFYv6") or
                (rtype == "A" and rhost in (domain, f"*.{domain}")) or
                (rtype == "CNAME" and rhost == f"www.{domain}" and "netlify" in rval.lower())
            )
            if should_delete:
                del_r = requests.delete(f"{BASE}/dns_zones/{zone_id}/dns_records/{rid}", headers=h)
                status = "Deleted" if del_r.ok else f"ERR({del_r.status_code})"
                print(f"  {status}: {rtype} {rhost} -> {rval}")
    else:
        print(f"  Could not get records: {records}")

    # Create A record for apex
    r1 = requests.post(f"{BASE}/dns_zones/{zone_id}/dns_records", headers=h, json={
        "type": "A", "hostname": domain, "value": VERCEL_IP, "ttl": 600
    })
    d1 = r1.json()
    if d1.get("id"):
        print(f"  OK A {domain} -> {VERCEL_IP}")
    else:
        print(f"  FAIL A: {d1}")

    # Create CNAME for www
    r2 = requests.post(f"{BASE}/dns_zones/{zone_id}/dns_records", headers=h, json={
        "type": "CNAME", "hostname": f"www.{domain}", "value": VERCEL_CNAME, "ttl": 600
    })
    d2 = r2.json()
    if d2.get("id"):
        print(f"  OK CNAME www.{domain} -> {VERCEL_CNAME}")
    else:
        print(f"  FAIL CNAME: {d2}")
    print()

print("=== Done! All Netlify DNS zones now point to Vercel. ===")
print("DNS propagates globally in 5-30 minutes.")
