param(
  [string]$Domain = 'https://www.jwordenasphaltpaving.com',
  [string]$OpenBrowserHandoff = 'false',
  [switch]$SkipRepoPreflight
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot '..')
$failed = $false

# Keep explicit reference so ScriptAnalyzer treats script parameter as used.
$null = $OpenBrowserHandoff

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Output ""
  Write-Output "=== $Name ==="
  try {
    & $Action
    Write-Output "PASS: $Name"
  } catch {
    Write-Output "FAIL: $Name"
    Write-Output $_
    $script:failed = $true
  }
}

function Test-CommandCenterRoute {
  param([string]$BaseDomain)

  $url = "$BaseDomain/command-center"
  $response = Invoke-WebRequest -Uri $url -UseBasicParsing
  $html = $response.Content

  $hasNotFoundMarker = $html -match '(?i)page not found|could not be found in this application'
  $hasCommandCenterMarker = $html -match '(?i)JWordenAI Command Center'

  if ($response.StatusCode -ne 200) {
    throw "HTTP status $($response.StatusCode) for $url"
  }

  if ($hasNotFoundMarker) {
    throw "Route integrity failed for $url (React Not Found marker detected)."
  }

  if (-not $hasCommandCenterMarker) {
    # SPA routes may render Command Center marker only after client-side hydration.
    $assetPath = [regex]::Match($html, 'src="(?<s>/assets/index-[^"]+\.js)"').Groups['s'].Value
    if ([string]::IsNullOrWhiteSpace($assetPath)) {
      throw "Route integrity failed for $url (Command Center marker missing and bundle asset not found)."
    }

    $bundleUrl = "$BaseDomain$assetPath"
    $bundleContent = (Invoke-WebRequest -Uri $bundleUrl -UseBasicParsing).Content
    $bundleHasRoute = $bundleContent -match '/command-center'
    if (-not $bundleHasRoute) {
      throw "Route integrity failed for $url (Command Center marker missing and deployed bundle lacks /command-center route)."
    }

    Write-Output "Route integrity PASS (SPA hydration): $url"
    return
  }

  Write-Output "Route integrity PASS: $url"
}

Push-Location $repoRoot
try {
  Write-Output '=== Deploy Route Guard ==='
  Write-Output "Domain: $Domain"
  Write-Output "Repo root: $repoRoot"

  if (-not $SkipRepoPreflight) {
    Invoke-Step -Name 'Repository preflight' -Action {
      powershell -ExecutionPolicy Bypass -File scripts/repo-preflight.ps1
    }
  } else {
    Write-Output 'SKIP: Repository preflight'
  }

  Invoke-Step -Name 'Indexing launch checks' -Action {
    powershell -ExecutionPolicy Bypass -File scripts/indexing-launch.ps1 -Domain $Domain -OpenBrowserHandoff $OpenBrowserHandoff
  }

  Invoke-Step -Name 'Command Center route integrity' -Action {
    Test-CommandCenterRoute -BaseDomain $Domain
  }

  Write-Output ""
  if ($failed) {
    Write-Output 'RESULT: FAILED'
    exit 2
  }

  Write-Output 'RESULT: PASS'
  exit 0
} finally {
  Pop-Location
}
