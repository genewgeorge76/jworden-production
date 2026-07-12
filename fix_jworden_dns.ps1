$NETLIFY_TOKEN = $null

# Get Netlify token from local config
$authFile = "$env:APPDATA\xdg.config\netlify\config.json"
$authFile2 = "$env:USERPROFILE\.netlify\config.json"

$config = $null
if (Test-Path $authFile) { $config = Get-Content $authFile | ConvertFrom-Json }
elseif (Test-Path $authFile2) { $config = Get-Content $authFile2 | ConvertFrom-Json }

if ($config) {
    $NETLIFY_TOKEN = $config.users.PSObject.Properties.Value[0].auth.token
}

if (-not $NETLIFY_TOKEN) {
    Write-Host "Could not find Netlify token automatically" -ForegroundColor Red
    exit 1
}

Write-Host "Found Netlify token" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $NETLIFY_TOKEN"
    "Content-Type"  = "application/json"
}

$DOMAIN = "jwordenasphaltpaving.com"

# Step 1: Find the DNS zone
Write-Host "Looking for Netlify DNS zone for $DOMAIN..." -ForegroundColor Yellow
$zones = Invoke-RestMethod "https://api.netlify.com/api/v1/dns_zones" -Headers $headers
$zone = $zones | Where-Object { $_.name -eq $DOMAIN }

if (-not $zone) {
    Write-Host "Zone not found. Creating DNS zone..." -ForegroundColor Yellow
    $zoneBody = @{ name = $DOMAIN } | ConvertTo-Json
    $zone = Invoke-RestMethod "https://api.netlify.com/api/v1/dns_zones" -Method POST -Headers $headers -Body $zoneBody
    Write-Host "Zone created: $($zone.id)" -ForegroundColor Green
} else {
    Write-Host "Found zone: $($zone.id)" -ForegroundColor Green
}

$ZONE_ID = $zone.id

# Step 2: Get existing records
$existing = Invoke-RestMethod "https://api.netlify.com/api/v1/dns_zones/$ZONE_ID/dns_records" -Headers $headers
Write-Host "Existing records:" -ForegroundColor Yellow
$existing | ForEach-Object { Write-Host "  $($_.type) $($_.hostname) -> $($_.value)" }

# Step 3: Remove old A record for @ if exists and add Vercel A record
$oldA = $existing | Where-Object { $_.type -eq "A" -and ($_.hostname -eq $DOMAIN -or $_.hostname -eq "@") }
if ($oldA) {
    Write-Host "Removing old A record..." -ForegroundColor Yellow
    foreach ($r in $oldA) {
        Invoke-RestMethod "https://api.netlify.com/api/v1/dns_zones/$ZONE_ID/dns_records/$($r.id)" -Method DELETE -Headers $headers | Out-Null
    }
}

$aBody = @{ type="A"; hostname=$DOMAIN; value="76.76.21.21"; ttl=600 } | ConvertTo-Json
$resp = Invoke-RestMethod "https://api.netlify.com/api/v1/dns_zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $aBody
Write-Host "A record set: $($resp.hostname) -> $($resp.value)" -ForegroundColor Green

# Step 4: Remove old CNAME for www and add Vercel CNAME
$oldCname = $existing | Where-Object { $_.type -eq "CNAME" -and $_.hostname -eq "www.$DOMAIN" }
if ($oldCname) {
    foreach ($r in $oldCname) {
        Invoke-RestMethod "https://api.netlify.com/api/v1/dns_zones/$ZONE_ID/dns_records/$($r.id)" -Method DELETE -Headers $headers | Out-Null
    }
}

$cnameBody = @{ type="CNAME"; hostname="www.$DOMAIN"; value="cname.vercel-dns.com"; ttl=600 } | ConvertTo-Json
$resp2 = Invoke-RestMethod "https://api.netlify.com/api/v1/dns_zones/$ZONE_ID/dns_records" -Method POST -Headers $headers -Body $cnameBody
Write-Host "CNAME record set: $($resp2.hostname) -> $($resp2.value)" -ForegroundColor Green

Write-Host ""
Write-Host "=== Done! jwordenasphaltpaving.com now points to Vercel ===" -ForegroundColor Cyan
