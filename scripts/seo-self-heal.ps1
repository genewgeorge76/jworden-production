param(
  [switch]$UpdateCoreRoutes
)

$ErrorActionPreference = 'Stop'

Write-Output '=== SEO Self-Heal ==='

$landingPagesPath = 'src/lib/landingPages.js'
$sitemapPath = 'public/sitemap.xml'
$primaryDomain = 'https://www.jwordenasphaltpaving.com'
$today = (Get-Date).ToString('yyyy-MM-dd')

$landingPages = Get-Content $landingPagesPath -Raw
$canonicalMatches = [regex]::Matches($landingPages, "canonicalPath:\s*'(?<p>/[^']+)'")
$landingCanonicalPaths = @()
foreach ($m in $canonicalMatches) {
  $landingCanonicalPaths += $m.Groups['p'].Value
}
$landingCanonicalPaths = $landingCanonicalPaths | Select-Object -Unique

[xml]$xmlDoc = Get-Content $sitemapPath -Raw
$ns = $xmlDoc.DocumentElement.NamespaceURI

$urlNodes = $xmlDoc.SelectNodes("//*[local-name()='url']")
$indexByLoc = @{}
foreach ($u in $urlNodes) {
  $locNode = $u.SelectSingleNode("*[local-name()='loc']")
  if ($locNode -and $locNode.InnerText) {
    $indexByLoc[$locNode.InnerText.Trim()] = $u
  }
}

function Invoke-UrlEntrySync {
  param(
    [xml]$Doc,
    [string]$Ns,
    [hashtable]$Index,
    [string]$Loc,
    [string]$Lastmod,
    [string]$Changefreq,
    [string]$Priority
  )

  $node = $null
  if ($Index.ContainsKey($Loc)) {
    $node = $Index[$Loc]
  } else {
    $node = $Doc.CreateElement('url', $Ns)
    $locNode = $Doc.CreateElement('loc', $Ns)
    $locNode.InnerText = $Loc
    $node.AppendChild($locNode) | Out-Null

    $lastmodNode = $Doc.CreateElement('lastmod', $Ns)
    $lastmodNode.InnerText = $Lastmod
    $node.AppendChild($lastmodNode) | Out-Null

    $changeNode = $Doc.CreateElement('changefreq', $Ns)
    $changeNode.InnerText = $Changefreq
    $node.AppendChild($changeNode) | Out-Null

    $priorityNode = $Doc.CreateElement('priority', $Ns)
    $priorityNode.InnerText = $Priority
    $node.AppendChild($priorityNode) | Out-Null

    $Doc.DocumentElement.AppendChild($node) | Out-Null
    $Index[$Loc] = $node
    return 'created'
  }

  $lastmodNode = $node.SelectSingleNode("*[local-name()='lastmod']")
  if (-not $lastmodNode) {
    $lastmodNode = $Doc.CreateElement('lastmod', $Ns)
    $node.AppendChild($lastmodNode) | Out-Null
  }
  $lastmodNode.InnerText = $Lastmod

  $changeNode = $node.SelectSingleNode("*[local-name()='changefreq']")
  if (-not $changeNode) {
    $changeNode = $Doc.CreateElement('changefreq', $Ns)
    $node.AppendChild($changeNode) | Out-Null
  }
  if ([string]::IsNullOrWhiteSpace($changeNode.InnerText)) {
    $changeNode.InnerText = $Changefreq
  }

  $priorityNode = $node.SelectSingleNode("*[local-name()='priority']")
  if (-not $priorityNode) {
    $priorityNode = $Doc.CreateElement('priority', $Ns)
    $node.AppendChild($priorityNode) | Out-Null
  }
  if ([string]::IsNullOrWhiteSpace($priorityNode.InnerText)) {
    $priorityNode.InnerText = $Priority
  }

  return 'updated'
}

$results = @()
foreach ($path in $landingCanonicalPaths) {
  $loc = "$primaryDomain$path"
  $status = Invoke-UrlEntrySync -Doc $xmlDoc -Ns $ns -Index $indexByLoc -Loc $loc -Lastmod $today -Changefreq 'weekly' -Priority '0.8'
  $results += "$status $loc"
}

if ($UpdateCoreRoutes) {
  $core = @(
    @{ loc = "$primaryDomain/"; changefreq = 'weekly'; priority = '1.0' },
    @{ loc = "$primaryDomain/locations"; changefreq = 'weekly'; priority = '0.9' },
    @{ loc = "$primaryDomain/blog"; changefreq = 'daily'; priority = '0.8' },
    @{ loc = "$primaryDomain/commercial/richmond-va"; changefreq = 'weekly'; priority = '0.9' },
    @{ loc = "$primaryDomain/jwordenai"; changefreq = 'monthly'; priority = '0.6' }
  )

  foreach ($item in $core) {
    $status = Invoke-UrlEntrySync -Doc $xmlDoc -Ns $ns -Index $indexByLoc -Loc $item.loc -Lastmod $today -Changefreq $item.changefreq -Priority $item.priority
    $results += "$status $($item.loc)"
  }
}

$settings = New-Object System.Xml.XmlWriterSettings
$settings.Indent = $true
$settings.IndentChars = '  '
$settings.NewLineChars = "`n"
$settings.NewLineHandling = 'Replace'

$writer = [System.Xml.XmlWriter]::Create($sitemapPath, $settings)
$xmlDoc.Save($writer)
$writer.Close()

Write-Output "Updated sitemap date to $today for landing and optional core routes."
$results | Sort-Object | ForEach-Object { Write-Output " - $_" }

Write-Output 'Self-heal complete.'
