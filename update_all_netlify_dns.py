import subprocess, json, sys, os

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

VERCEL_IP = "76.76.21.21"
VERCEL_CNAME = "cname.vercel-dns.com"

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

def run_netlify(method, data):
    # Write data to temp file to avoid shell quoting issues
    tmp = os.path.join(os.environ.get('TEMP','.'),'netlify_data.json')
    with open(tmp,'w') as f:
        json.dump(data, f)
    result = subprocess.run(
        f'npx netlify-cli api {method} --data @{tmp}',
        shell=True, capture_output=True, text=True
    )
    if result.returncode != 0 or not result.stdout.strip():
        # fallback: inline
        data_str = json.dumps(data).replace('"','\\"')
        result = subprocess.run(
            f'npx netlify-cli api {method} --data "{data_str}"',
            shell=True, capture_output=True, text=True
        )
    try:
        return json.loads(result.stdout)
    except:
        return {"_raw": result.stdout.strip(), "_err": result.stderr.strip()}

print("=== Updating ALL Netlify DNS zones -> Vercel ===\n")

for domain, zone_id in ZONES.items():
    print(f"\n--- {domain} ---")

    # Get existing records
    records = run_netlify("getDnsRecords", {"dns_zone_id": zone_id})
    if isinstance(records, list):
        for r in records:
            rtype = r.get("type","")
            rhost = r.get("hostname","")
            rval  = r.get("value","")
            rid   = r.get("id","")
            # Delete Netlify-managed and old A records
            if rtype in ("NETLIFY","NETLIFYv6") or \
               (rtype == "A" and rhost in (domain, f"*.{domain}")) or \
               (rtype == "CNAME" and rhost == f"www.{domain}" and "netlify" in rval.lower()):
                run_netlify("deleteDnsRecord", {"dns_zone_id": zone_id, "dns_record_id": rid})
                print(f"  Deleted {rtype} {rhost}")
    else:
        print(f"  Warning getting records: {records.get('_raw','')[:80]}")

    # Add A record
    r1 = run_netlify("createDnsRecord", {
        "dns_zone_id": zone_id, "type": "A",
        "hostname": domain, "value": VERCEL_IP, "ttl": 600
    })
    if r1.get("id"):
        print(f"  OK A {domain} -> {VERCEL_IP}")
    else:
        print(f"  FAIL A: {r1.get('_raw','')[:100]}")

    # Add CNAME for www
    r2 = run_netlify("createDnsRecord", {
        "dns_zone_id": zone_id, "type": "CNAME",
        "hostname": f"www.{domain}", "value": VERCEL_CNAME, "ttl": 600
    })
    if r2.get("id"):
        print(f"  OK CNAME www.{domain} -> {VERCEL_CNAME}")
    else:
        print(f"  FAIL CNAME: {r2.get('_raw','')[:100]}")

print("\n=== All zones updated -> Vercel! Propagates in 5-30 mins ===")
