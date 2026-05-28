$ErrorActionPreference = 'Stop'
$h = Invoke-WebRequest "https://www.jwordenasphaltpaving.com/" -UseBasicParsing -TimeoutSec 30
$html = $h.Content
$title = ([regex]::Match($html,'<title>([^<]+)</title>','IgnoreCase')).Groups[1].Value
$descMatch = [regex]::Match($html,'name="description"\s+content="([^"]+)"','IgnoreCase')
$desc = $descMatch.Groups[1].Value
$ogCount = ([regex]::Matches($html,'property="og:','IgnoreCase')).Count
$jsonLd = ([regex]::Matches($html,'application/ld\+json','IgnoreCase')).Count
$h1 = ([regex]::Matches($html,'<h1','IgnoreCase')).Count
$imgs = ([regex]::Matches($html,'<img','IgnoreCase')).Count
$alts = ([regex]::Matches($html,'<img[^>]+alt=','IgnoreCase')).Count
$canon = [regex]::IsMatch($html,'rel="canonical"','IgnoreCase')
$gsc = [regex]::IsMatch($html,'google-site-verification','IgnoreCase')
$hsts = $h.Headers.ContainsKey('strict-transport-security')
$rb = Invoke-WebRequest "https://www.jwordenasphaltpaving.com/robots.txt" -UseBasicParsing -TimeoutSec 15
$sm = Invoke-WebRequest "https://www.jwordenasphaltpaving.com/sitemap.xml" -UseBasicParsing -TimeoutSec 15
$smUrls = ([regex]::Matches($sm.Content,'<url>')).Count
"=== ON-PAGE SEO - homepage ==="
"Title         : $title"
"Title len     : $($title.Length) chars (ideal 50-60)"
"Desc          : $desc"
"Desc len      : $($desc.Length) chars (ideal 140-160)"
"H1 count      : $h1"
"OG tags       : $ogCount"
"JSON-LD blocks: $jsonLd"
"Canonical     : $canon"
"Images        : $imgs (with alt: $alts)"
"GSC meta      : $gsc"
"HSTS          : $hsts"
"robots.txt    : $($rb.StatusCode) bytes=$($rb.Content.Length)"
"sitemap URLs  : $smUrls"
