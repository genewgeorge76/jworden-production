param(
  [string]$Domain = 'https://www.jwordenasphaltpaving.com'
)

$ErrorActionPreference = 'Stop'

Write-Output "=== Live Deploy Check: $Domain ==="

$homeResp = Invoke-WebRequest -Uri "$Domain/" -UseBasicParsing
$title = [regex]::Match($homeResp.Content, '<title>(.*?)</title>').Groups[1].Value
$assetPatterns = @(
  '/assets/index-[^"''\s>]+\.js(?:\?[^"''\s>]*)?',
  '/assets/index-[^"''\s>]+\.mjs(?:\?[^"''\s>]*)?'
)
$asset = 'NOT_FOUND'
foreach ($pattern in $assetPatterns) {
  $assetMatch = [regex]::Match($homeResp.Content, $pattern)
  if ($assetMatch.Success) {
    $asset = $assetMatch.Value
    break
  }
}

Write-Output "Home status: $([int]$homeResp.StatusCode)"
Write-Output "Home title: $title"
Write-Output "Index asset: $asset"

$paths = @(
  '/jwordenai',
  '/contractor-ai-platform',
  '/lp/richmond-parking-lot-repair',
  '/lp/henrico-parking-lot-resurfacing',
  '/lp/chester-industrial-asphalt-paving',
  '/lp/fairfax-hoa-street-repair',
  '/lp/norfolk-warehouse-parking-lot-repair',
  '/lp/fredericksburg-church-parking-lot-paving'
)

foreach ($path in $paths) {
  $resp = Invoke-WebRequest -Uri "$Domain$path" -UseBasicParsing
  $isApp404 = $resp.Content -match 'Page Not Found'
  if ($isApp404) {
    Write-Output "ROUTE_FAIL`t$path`tIn-app 404"
  } else {
    Write-Output "ROUTE_OK`t$path"
  }
}

$xml = (Invoke-WebRequest -Uri "$Domain/sitemap.xml" -UseBasicParsing).Content
$expected = @(
  'jwordenai',
  'contractor-ai-platform',
  'lp/richmond-parking-lot-repair',
  'lp/henrico-parking-lot-resurfacing',
  'lp/chester-industrial-asphalt-paving',
  'lp/fairfax-hoa-street-repair',
  'lp/norfolk-warehouse-parking-lot-repair',
  'lp/fredericksburg-church-parking-lot-paving'
)
foreach ($needle in $expected) {
  if ($xml -like "*$needle*") {
    Write-Output "SITEMAP_OK`t$needle"
  } else {
    Write-Output "SITEMAP_FAIL`t$needle"
  }
}
