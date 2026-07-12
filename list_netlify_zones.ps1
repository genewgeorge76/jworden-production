$zones = Get-Content 'netlify_dns_zones_full.json' | ConvertFrom-Json

Write-Host "=== All Netlify DNS Zones ===" -ForegroundColor Cyan
Write-Host ""

foreach ($zone in $zones) {
    $registrar = if ($zone.uses_netlify_registrar) { "NETLIFY-REGISTRAR" } else { "External" }
    Write-Host "ZONE: $($zone.name) | ID: $($zone.id) | $registrar" -ForegroundColor $(if ($zone.uses_netlify_registrar) { "Yellow" } else { "Gray" })
}

Write-Host ""
Write-Host "Total zones: $($zones.Count)"
Write-Host "Netlify-registered: $(($zones | Where-Object { $_.uses_netlify_registrar }).Count)"
