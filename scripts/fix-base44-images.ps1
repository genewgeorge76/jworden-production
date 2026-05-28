# Replace dead media.api.com (Base44 CDN) URLs with local images extracted from Google Takeout.
[CmdletBinding()]
param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1. Collect every unique broken URL across src/ and public/
$urls = (Get-ChildItem -Recurse src,public -File |
  Select-String -Pattern 'https://media\.api\.com[^"''`\s\)]+' -AllMatches
).Matches.Value | Sort-Object -Unique

Write-Output ("Found {0} unique media.api.com URLs" -f $urls.Count)

# 2. Pools of available local images (from Google Takeout extraction)
$kfcDir  = '/work/imported/KFC'
$carsDir = '/work/imported/va cars photos and videos for website'
$kfc  = @('IMG_9499.JPG','IMG_9500.JPG','IMG_9507.JPG','IMG_9509.JPG','IMG_9510.JPG','IMG_9512.JPG','IMG_9514.JPG','IMG_9518.JPG','IMG_9519.JPG','IMG_9496.JPG','IMG_9499-COLLAGE.jpg')
$cars = @('IMG_8711.JPG','IMG_8713.JPG','IMG_8717.JPG','IMG_8718.JPG','IMG_8721.JPG','IMG_8724.JPG','IMG_8728.JPG','IMG_8729.JPG','IMG_8730.JPG','IMG_8732.JPG','IMG_8733.JPG','IMG_8735.JPG','IMG_8838.JPG','IMG_8839.JPG')

# 3. Deterministic mapping
$map = [ordered]@{}
$kIdx = 0; $cIdx = 0
foreach ($u in $urls) {
  $name = ($u -split '/')[-1].ToLower()
  if ($name -like '*houzz*')                     { $map[$u] = '/logo.png';                       continue }
  if ($name -like '*.pdf')                       { $map[$u] = '#';                                continue }
  if ($name -eq 'fd6e29837_20171212_192947499_ios.jpg') {
                                                   $map[$u] = '/hero-paving.jpg';                 continue }
  if ($name -like '*kfc*' -or $name -match '20180209_|20170220_|20170519_|20170524_|20170821_') {
                                                   $map[$u] = "$kfcDir/$($kfc[$kIdx % $kfc.Count])"
                                                   $kIdx++;                                       continue }
  $map[$u] = "$carsDir/$($cars[$cIdx % $cars.Count])"
  $cIdx++
}

$map | ConvertTo-Json | Set-Content -Path .\.media-url-map.json -Encoding UTF8
Write-Output "Wrote .media-url-map.json"

# 4. Apply replacements
$targetFiles = Get-ChildItem -Recurse src,public -File |
  Where-Object { $_.Extension -match '\.(js|jsx|ts|tsx|json|html|xml|md|css)$' } |
  Where-Object { (Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) -match 'media\.api\.com' }

Write-Output ("Files to update: {0}" -f $targetFiles.Count)
$totalReplacements = 0
foreach ($f in $targetFiles) {
  $content = Get-Content $f.FullName -Raw -Encoding UTF8
  $orig = $content
  $fileReps = 0
  foreach ($k in $map.Keys) {
    if ($content.Contains($k)) {
      $occ = ($content.Length - $content.Replace($k,'').Length) / $k.Length
      $content = $content.Replace($k, $map[$k])
      $fileReps += $occ
    }
  }
  if ($content -ne $orig) {
    if (-not $DryRun) { Set-Content -Path $f.FullName -Value $content -Encoding UTF8 -NoNewline }
    $totalReplacements += $fileReps
    Write-Output ("  {0,-60} {1} replacements" -f ($f.FullName.Replace($root + '\\','')), $fileReps)
  }
}
Write-Output ("Total replacements: {0}" -f $totalReplacements)
if ($DryRun) { Write-Output "[DRY RUN - no files written]" }
