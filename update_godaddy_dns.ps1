# GoDaddy credentials come from the environment, never from this file.
#
# They were hardcoded here, and in three sibling scripts, and committed. A
# GoDaddy key and secret are DNS write access to every domain on the account —
# 26 of them — which means whoever holds them can repoint the websites, move
# the MX records and read the mail, or pass a domain-control validation and
# issue certificates. Read access to this repository was enough to do all of
# that.
#
# Deleting the literals does not undo it: they are still in git history, so
# the pair has to be ROTATED in the GoDaddy account. Treat the old key as
# burned.
#
#   $env:GODADDY_API_KEY    = "..."
#   $env:GODADDY_API_SECRET = "..."

$GD_KEY    = $env:GODADDY_API_KEY
$GD_SECRET = $env:GODADDY_API_SECRET

if (-not $GD_KEY -or -not $GD_SECRET) {
    Write-Error "GODADDY_API_KEY and GODADDY_API_SECRET must be set in the environment."
    exit 1
}

$GD_HEADERS = @{
    "Authorization" = "sso-key ${GD_KEY}:${GD_SECRET}"
    "Content-Type"  = "application/json"
}

# Check which domains are on GoDaddy DNS vs external nameservers
$domains = Invoke-RestMethod "https://api.godaddy.com/v1/domains?limit=500&statuses=ACTIVE" -Headers $GD_HEADERS
Write-Host "=== Nameserver check for all domains ===" -ForegroundColor Cyan

$godaddyDns = @()
$externalDns = @()

foreach ($d in $domains) {
    $domain = $d.domain
    # Try to get records — if UNKNOWN_DOMAIN, it's on external NS
    try {
        $records = Invoke-RestMethod "https://api.godaddy.com/v1/domains/$domain/records" -Headers $GD_HEADERS -ErrorAction Stop
        Write-Host "GoDaddy DNS: $domain" -ForegroundColor Green
        $godaddyDns += $domain
    } catch {
        Write-Host "External NS: $domain" -ForegroundColor Yellow
        $externalDns += $domain
    }
}

Write-Host ""
Write-Host "=== On GoDaddy DNS ($($godaddyDns.Count)) - CAN update via API ===" -ForegroundColor Green
$godaddyDns | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "=== On External NS ($($externalDns.Count)) - Need manual NS change OR update via Netlify/Vercel ===" -ForegroundColor Yellow
$externalDns | ForEach-Object { Write-Host "  $_" }

# Now update DNS for GoDaddy-managed domains
Write-Host ""
Write-Host "=== Updating DNS for GoDaddy-managed domains ===" -ForegroundColor Cyan

foreach ($domain in $godaddyDns) {
    # A record for apex - correct GoDaddy API format
    $aRecord = '[{"data":"76.76.21.21","name":"@","ttl":600,"type":"A"}]'
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/$domain/records/A/@" -Method PUT -Headers $GD_HEADERS -Body $aRecord -ErrorAction Stop | Out-Null
        Write-Host "A    OK  $domain -> 76.76.21.21" -ForegroundColor Green
    } catch {
        Write-Host "A    ERR $domain : $($_.ErrorDetails.Message)" -ForegroundColor Red
    }

    # CNAME for www
    $cnameRecord = '[{"data":"cname.vercel-dns.com","name":"www","ttl":600,"type":"CNAME"}]'
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/$domain/records/CNAME/www" -Method PUT -Headers $GD_HEADERS -Body $cnameRecord -ErrorAction Stop | Out-Null
        Write-Host "CNAME OK  www.$domain -> cname.vercel-dns.com" -ForegroundColor Green
    } catch {
        Write-Host "CNAME ERR www.$domain : $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Special: app subdomain for jwordenasphaltpaving.com (if on GoDaddy DNS)
if ($godaddyDns -contains "jwordenasphaltpaving.com") {
    $appRecord = '[{"data":"cname.vercel-dns.com","name":"app","ttl":600,"type":"CNAME"}]'
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/jwordenasphaltpaving.com/records/CNAME/app" -Method PUT -Headers $GD_HEADERS -Body $appRecord -ErrorAction Stop | Out-Null
        Write-Host "CNAME OK  app.jwordenasphaltpaving.com -> cname.vercel-dns.com" -ForegroundColor Green
    } catch {
        Write-Host "CNAME ERR app.jwordenasphaltpaving.com : $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Cyan
