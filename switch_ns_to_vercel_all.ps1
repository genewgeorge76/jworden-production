$GD_KEY    = "dKNtgiYynXQb_MUrpJZy3UX6PABmrkpmRr2"
$GD_SECRET = "7Eixwe4tX7ZTo8wJe8mBni"
$GD_HEADERS = @{
    "Authorization" = "sso-key ${GD_KEY}:${GD_SECRET}"
    "Content-Type"  = "application/json"
}

# The 19 domains that were on external NS
$REMAINING = @(
    "asphaltpavingkansascity.com",
    "atlantaasphaltpavingpros.com",
    "blueridgeasphaltpaving.com",
    "jwordenuniversity.com",
    "michiganasphaltpavingpros.info",
    "michiganasphaltpavingpros.net",
    "michiganasphaltpavingpros.shop",
    "michiganasphaltpavingpros.store",
    "michiganasphaltpavingpros.xyz",
    "richmondasphaltpaving.com",
    "richmondasphaltpaving.net",
    "richmondasphaltpros.com",
    "savannahasphaltpaving.com",
    "savannahpaving.info",
    "savannahpaving.life",
    "savannahpaving.net",
    "savannahpaving.shop",
    "savannahpaving.store",
    "thewordenstandard.com"
)

# Vercel's global nameservers
$VERCEL_NS = '{"nameServers":["ns1.vercel-dns.com","ns2.vercel-dns.com"]}'

Write-Host "=== Switching remaining 19 domains to Vercel Nameservers ===" -ForegroundColor Cyan
foreach ($domain in $REMAINING) {
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/$domain" -Method PATCH -Headers $GD_HEADERS -Body $VERCEL_NS -ErrorAction Stop | Out-Null
        Write-Host "OK   $domain -> Vercel NS" -ForegroundColor Green
    } catch {
        # Fallback to catching the response error
        $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        $errMsg = if ($err.message) { $err.message } else { $_.Exception.Message }
        Write-Host "ERR  $domain : $errMsg" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "Done! All domains are now mapped." -ForegroundColor Cyan
