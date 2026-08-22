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

# These are on external (Netlify) nameservers - switch them to Vercel NS
$SWITCH_TO_VERCEL_NS = @(
    "jwordenasphaltpaving.com",
    "jwordenandsonspaving.com",
    "asphaltpavingkansascity.com",
    "atlantaasphaltpavingpros.com",
    "blueridgeasphaltpaving.com",
    "jwordenuniversity.com",
    "michiganasphaltpavingpros.net",
    "michiganasphaltpavingpros.com",
    "richmondasphaltpaving.com",
    "richmondasphaltpaving.net",
    "richmondasphaltpros.com",
    "savannahasphaltpaving.com",
    "savannahpaving.net",
    "thewordenstandard.com"
)

# Vercel nameservers
$VERCEL_NS = '{"nameServers":["ns1.vercel-dns.com","ns2.vercel-dns.com"]}'

Write-Host "=== Switching nameservers to Vercel for $($SWITCH_TO_VERCEL_NS.Count) domains ===" -ForegroundColor Cyan
Write-Host ""

foreach ($domain in $SWITCH_TO_VERCEL_NS) {
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/$domain" -Method PATCH -Headers $GD_HEADERS -Body $VERCEL_NS -ErrorAction Stop | Out-Null
        Write-Host "OK   $domain -> ns1.vercel-dns.com / ns2.vercel-dns.com" -ForegroundColor Green
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        Write-Host "ERR  $domain : $($err.message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Done! Vercel will auto-provision SSL for each domain. ===" -ForegroundColor Cyan
Write-Host "=== DNS propagation takes 5-30 mins globally. ===" -ForegroundColor Yellow
