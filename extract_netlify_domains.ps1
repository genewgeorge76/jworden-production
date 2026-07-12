$sites = Get-Content 'netlify_sites_raw.json' | ConvertFrom-Json
$results = $sites | Where-Object { $_.custom_domain -or ($_.domain_aliases -and $_.domain_aliases.Count -gt 0) }
foreach ($site in $results) {
    $aliases = if ($site.domain_aliases) { $site.domain_aliases -join ',' } else { '' }
    Write-Host "NAME=$($site.name) | DOMAIN=$($site.custom_domain) | ALIASES=$aliases | DISABLED=$($site.disabled)"
}
Write-Host ""
Write-Host "--- ALL SITES (including no custom domain) ---"
foreach ($site in $sites) {
    Write-Host "NAME=$($site.name) | DOMAIN=$($site.custom_domain) | URL=$($site.url)"
}
