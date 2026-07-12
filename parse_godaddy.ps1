$raw = Get-Content 'godaddy_domains_raw.json' -Raw
$data = $raw | ConvertFrom-Json
Write-Host "Total domains: $($data.Count)"
Write-Host ""
$data | Sort-Object domain | ForEach-Object {
    $exp = if ($_.expires) { $_.expires.Substring(0,10) } else { 'N/A' }
    Write-Host "$($_.domain) | $($_.status) | expires: $exp"
}
