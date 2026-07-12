$GD_KEY    = "dKNtgiYynXQb_MUrpJZy3UX6PABmrkpmRr2"
$GD_SECRET = "7Eixwe4tX7ZTo8wJe8mBni"
$GD_HEADERS = @{
    "Authorization" = "sso-key ${GD_KEY}:${GD_SECRET}"
    "Content-Type"  = "application/json"
}

# Remaining variant domains still on external NS
$REMAINING = @(
    "michiganasphaltpavingpros.info",
    "michiganasphaltpavingpros.shop",
    "michiganasphaltpavingpros.store",
    "michiganasphaltpavingpros.xyz",
    "savannahpaving.info",
    "savannahpaving.life",
    "savannahpaving.shop",
    "savannahpaving.store"
)

$VERCEL_NS = '{"nameServers":["ns1.vercel-dns.com","ns2.vercel-dns.com"]}'

Write-Host "=== Switching remaining variant domains to Vercel NS ===" -ForegroundColor Cyan
foreach ($domain in $REMAINING) {
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/$domain" -Method PATCH -Headers $GD_HEADERS -Body $VERCEL_NS -ErrorAction Stop | Out-Null
        Write-Host "OK   $domain" -ForegroundColor Green
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        Write-Host "ERR  $domain : $($err.message)" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
