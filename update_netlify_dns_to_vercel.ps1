$ZONE_ID_JWORDEN  = "69a506f58f71a3a9cdcbf1ff"   # jwordenasphaltpaving.com
$ZONE_ID_JANDsons = "69a0eabe5f6a9758e0b49b73"   # jwordenandsonspaving.com

# Records to delete then replace with Vercel targets
# jwordenasphaltpaving.com managed record IDs (NETLIFY/NETLIFYv6 pointing to Netlify)
$DELETE_IDS_JWORDEN = @(
    "69d9949ed906cb0008059bfd",  # *.jwordenasphaltpaving.com NETLIFYv6
    "69ef6976c5215200081b5f5a",  # www NETLIFY
    "69ef6976c5215200081b5f5b",  # www NETLIFYv6
    "69ef6977c5215200081b5f5c",  # apex NETLIFY
    "69ef6977c5215200081b5f5e",  # apex NETLIFYv6
    "69e59f756a8b6766b49d3ca9"   # apex A -> 75.2.60.5 (old)
)

$DELETE_IDS_JANDsons = @(
    "69d9949fd906cb0008059bff",
    "69d9949fd906cb0008059c00",
    "6a03194aa3e8d00008c13b29",
    "6a03194aa3e8d00008c13b2a",
    "6a03194ba3e8d00008c13b2b",
    "6a03194ba3e8d00008c13b2c"
)

Write-Host "=== Updating Netlify DNS zones to point to Vercel ===" -ForegroundColor Cyan

function Invoke-NetlifyApi($path, $method = "GET", $body = $null) {
    $cmd = "npx netlify-cli api $path"
    if ($body) {
        $tmpFile = [System.IO.Path]::GetTempFileName()
        $body | Set-Content $tmpFile
        $resp = cmd /c "npx netlify-cli api $path --data `"$(Get-Content $tmpFile -Raw)`" 2>&1"
        Remove-Item $tmpFile
    } else {
        $resp = cmd /c "npx netlify-cli api $path 2>&1"
    }
    return $resp
}

# Delete old Netlify-managed records for jwordenasphaltpaving.com
Write-Host ""
Write-Host "Removing old Netlify records for jwordenasphaltpaving.com..." -ForegroundColor Yellow
foreach ($id in $DELETE_IDS_JWORDEN) {
    $result = cmd /c "npx netlify-cli api deleteDnsRecord --data `"{`"dns_zone_id`":`"$ZONE_ID_JWORDEN`",`"dns_record_id`":`"$id`"}`" 2>&1"
    Write-Host "  Deleted $id" -ForegroundColor Gray
}

# Add Vercel A record for apex jwordenasphaltpaving.com
Write-Host "Adding A record jwordenasphaltpaving.com -> 76.76.21.21..." -ForegroundColor Yellow
$r1 = cmd /c "npx netlify-cli api createDnsRecord --data `"{`"dns_zone_id`":`"$ZONE_ID_JWORDEN`",`"type`":`"A`",`"hostname`":`"jwordenasphaltpaving.com`",`"value`":`"76.76.21.21`",`"ttl`":600}`" 2>&1"
Write-Host $r1 -ForegroundColor Green

# Add Vercel CNAME for www.jwordenasphaltpaving.com
Write-Host "Adding CNAME www.jwordenasphaltpaving.com -> cname.vercel-dns.com..." -ForegroundColor Yellow
$r2 = cmd /c "npx netlify-cli api createDnsRecord --data `"{`"dns_zone_id`":`"$ZONE_ID_JWORDEN`",`"type`":`"CNAME`",`"hostname`":`"www.jwordenasphaltpaving.com`",`"value`":`"cname.vercel-dns.com`",`"ttl`":600}`" 2>&1"
Write-Host $r2 -ForegroundColor Green

# Delete old records for jwordenandsonspaving.com
Write-Host ""
Write-Host "Removing old Netlify records for jwordenandsonspaving.com..." -ForegroundColor Yellow
foreach ($id in $DELETE_IDS_JANDONS) {
    cmd /c "npx netlify-cli api deleteDnsRecord --data `"{`"dns_zone_id`":`"$ZONE_ID_JANDONS`",`"dns_record_id`":`"$id`"}`" 2>&1" | Out-Null
    Write-Host "  Deleted $id" -ForegroundColor Gray
}

# Add Vercel A + CNAME for jwordenandsonspaving.com
Write-Host "Adding A record jwordenandsonspaving.com -> 76.76.21.21..." -ForegroundColor Yellow
$r3 = cmd /c "npx netlify-cli api createDnsRecord --data `"{`"dns_zone_id`":`"$ZONE_ID_JANDONS`",`"type`":`"A`",`"hostname`":`"jwordenandsonspaving.com`",`"value`":`"76.76.21.21`",`"ttl`":600}`" 2>&1"
Write-Host $r3

$r4 = cmd /c "npx netlify-cli api createDnsRecord --data `"{`"dns_zone_id`":`"$ZONE_ID_JANDONS`",`"type`":`"CNAME`",`"hostname`":`"www.jwordenandsonspaving.com`",`"value`":`"cname.vercel-dns.com`",`"ttl`":600}`" 2>&1"
Write-Host $r4

Write-Host ""
Write-Host "=== Done! Both domains now point to Vercel. ===" -ForegroundColor Cyan
Write-Host "DNS propagates in 5-30 mins." -ForegroundColor Yellow
