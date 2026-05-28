param(
  [string]$Domain = 'https://www.jwordenasphaltpaving.com',
  [string]$OpenBrowserHandoff = 'true'
)

$ErrorActionPreference = 'Stop'
$openHandoff = @('1','true','yes','on') -contains $OpenBrowserHandoff.ToLowerInvariant()

function Test-UrlStatus {
  param([string]$Url)
  try {
    $r = Invoke-WebRequest -Uri $Url -Method Head -MaximumRedirection 5 -UseBasicParsing
    return [pscustomobject]@{ url = $Url; status = [int]$r.StatusCode; ok = $true }
  } catch {
    if ($_.Exception.Response) {
      return [pscustomobject]@{ url = $Url; status = [int]$_.Exception.Response.StatusCode; ok = $false }
    }
    return [pscustomobject]@{ url = $Url; status = -1; ok = $false }
  }
}

Write-Output '=== JWordenAI Indexing Launch ==='

$homeUrl = "$Domain/"
$blogUrl = "$Domain/blog"
$commandCenterUrl = "$Domain/command-center"
$robots = "$Domain/robots.txt"
$sitemap = "$Domain/sitemap.xml"
$imageSitemap = "$Domain/image-sitemap.xml"

$checks = @(
  (Test-UrlStatus -Url $homeUrl)
  (Test-UrlStatus -Url $blogUrl)
  (Test-UrlStatus -Url $robots)
  (Test-UrlStatus -Url $sitemap)
  (Test-UrlStatus -Url $imageSitemap)
)

$checks | ForEach-Object {
  Write-Output ("{0}`t{1}" -f $_.url, $_.status)
}

$all200 = ($checks | Where-Object { $_.status -ne 200 }).Count -eq 0
if (-not $all200) {
  Write-Output 'WARNING: One or more critical URLs are not HTTP 200. Fix before full launch.'
}

try {
  $htmlHome = (Invoke-WebRequest -Uri $homeUrl -UseBasicParsing).Content
  $homeNoindex = if ($htmlHome -match '(?i)noindex') { 'yes' } else { 'no' }
  $homeCanonical = [regex]::Match($htmlHome,'(?i)<link[^>]+rel=["'']canonical["''][^>]+href=["'']([^"'']+)').Groups[1].Value
  if ([string]::IsNullOrWhiteSpace($homeCanonical)) { $homeCanonical = '(missing)' }

  $htmlBlog = (Invoke-WebRequest -Uri $blogUrl -UseBasicParsing).Content
  $blogNoindex = if ($htmlBlog -match '(?i)noindex') { 'yes' } else { 'no' }
  $blogCanonical = [regex]::Match($htmlBlog,'(?i)<link[^>]+rel=["'']canonical["''][^>]+href=["'']([^"'']+)').Groups[1].Value
  if ([string]::IsNullOrWhiteSpace($blogCanonical)) { $blogCanonical = '(missing)' }

  Write-Output "Home: noindex=$homeNoindex canonical=$homeCanonical"
  Write-Output "Blog: noindex=$blogNoindex canonical=$blogCanonical"

  $htmlCommandCenter = (Invoke-WebRequest -Uri $commandCenterUrl -UseBasicParsing).Content
  $hasNotFoundMarker = $htmlCommandCenter -match '(?i)page not found|could not be found in this application'
  $hasCommandCenterMarker = $htmlCommandCenter -match '(?i)JWordenAI Command Center'
  if ($hasNotFoundMarker) {
    Write-Output 'WARNING: /command-center route returned app-level Not Found. Verify latest deploy includes Command Center route.'
  } elseif (-not $hasCommandCenterMarker) {
    # SPA routes may hydrate this marker client-side; confirm route exists in deployed bundle.
    $assetPath = [regex]::Match($htmlCommandCenter, 'src="(?<s>/assets/index-[^"]+\.js)"').Groups['s'].Value
    if ([string]::IsNullOrWhiteSpace($assetPath)) {
      Write-Output 'WARNING: /command-center marker missing and bundle asset could not be detected.'
    } else {
      $bundleUrl = "$Domain$assetPath"
      $bundleContent = (Invoke-WebRequest -Uri $bundleUrl -UseBasicParsing).Content
      $bundleHasRoute = $bundleContent -match '/command-center'
      if ($bundleHasRoute) {
        Write-Output 'Command Center route integrity: PASS (SPA hydration via bundle route check)'
      } else {
        Write-Output 'WARNING: /command-center marker missing and deployed bundle lacks route. Verify latest deploy includes Command Center route.'
      }
    }
  } else {
    Write-Output 'Command Center route integrity: PASS'
  }
} catch {
  Write-Output 'WARNING: Could not read meta/canonical checks from HTML responses.'
}

Write-Output 'Info: Legacy anonymous sitemap ping endpoints are deprecated; Search Console/Bing Webmaster submission is used instead.'

if ($openHandoff) {
  $gscSitemaps = "https://search.google.com/search-console/sitemaps?resource_id=sc-domain:jwordenasphaltpaving.com"
  $gscInspectHome = "https://search.google.com/search-console/inspect?resource_id=sc-domain:jwordenasphaltpaving.com&id=$([uri]::EscapeDataString($homeUrl))"
  $gscInspectBlog = "https://search.google.com/search-console/inspect?resource_id=sc-domain:jwordenasphaltpaving.com&id=$([uri]::EscapeDataString($blogUrl))"

  Set-Clipboard -Value "$sitemap`n$imageSitemap"
  Write-Output 'Copied sitemap URLs to clipboard.'

  Start-Process $gscSitemaps
  Start-Process $gscInspectHome
  Start-Process $gscInspectBlog

  Write-Output 'Opened Google Search Console handoff pages (login required).'
  Write-Output 'After login: submit sitemap.xml + image-sitemap.xml, then Request Indexing for home and blog.'
}

Write-Output '=== Indexing launch automation complete ==='
