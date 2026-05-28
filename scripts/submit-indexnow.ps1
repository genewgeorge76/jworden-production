param(
  [string]$HostName = 'www.jwordenasphaltpaving.com',
  [string]$Key = '3ef8a81ce186414ca3235bebb5072f22'
)

$ErrorActionPreference = 'Stop'

$base = "https://$HostName"
$urls = @(
  "$base/",
  "$base/services",
  "$base/paving",
  "$base/parking-lots",
  "$base/residential",
  "$base/tar-and-chip",
  "$base/crack-repair",
  "$base/locations",
  "$base/locations/richmond-va",
  "$base/locations/chester-va",
  "$base/locations/midlothian-va",
  "$base/locations/virginia-beach-va",
  "$base/general-contracting",
  "$base/reviews",
  "$base/contact"
)

$body = @{
  host = $HostName
  key = $Key
  keyLocation = "$base/$Key.txt"
  urlList = $urls
} | ConvertTo-Json -Depth 4

Write-Output "Submitting $($urls.Count) URLs to IndexNow for $HostName"
Invoke-RestMethod -Uri 'https://api.indexnow.org/IndexNow' -Method Post -ContentType 'application/json; charset=utf-8' -Body $body
Write-Output 'IndexNow submission complete.'