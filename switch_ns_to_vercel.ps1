$GD_KEY    = "dKNtgiYynXQb_MUrpJZy3UX6PABmrkpmRr2"
$GD_SECRET = "7Eixwe4tX7ZTo8wJe8mBni"
$GD_HEADERS = @{
    "Authorization" = "sso-key ${GD_KEY}:${GD_SECRET}"
    "Content-Type"  = "application/json"
}

# These are on external (Netlify) nameservers - switch them to Vercel NS
$SWITCH_TO_VERCEL_NS = @(
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
