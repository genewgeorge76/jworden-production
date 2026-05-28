# scripts/preflight.ps1
# Run before every PR or push. Catches problems before CI does.
# Usage:  .\scripts\preflight.ps1

$ErrorActionPreference = 'Continue'
$failed = @()

function Step($name, $cmd) {
    Write-Output "`n=== $name ==="
    & cmd /c $cmd
    if ($LASTEXITCODE -ne 0) {
        $script:failed += $name
        Write-Output "FAILED: $name"
    } else {
        Write-Output "OK: $name"
    }
}

Push-Location (Split-Path $PSScriptRoot -Parent)

Step 'Lint'  'npm run lint'
Step 'Build' 'npm run build'

# Bundle size guard
Write-Output "`n=== Bundle Size Check ==="
if (Test-Path dist/assets) {
    $largest = Get-ChildItem dist/assets -File -Filter *.js | Sort-Object Length -Desc | Select-Object -First 1
    $sizeKB = [math]::Round($largest.Length / 1KB)
    Write-Output "Largest JS chunk: $($largest.Name) = $sizeKB KB"
    if ($sizeKB -gt 1200) {
        Write-Output "WARNING: chunk over 1200 KB — consider code-splitting"
    }
}

# Secret scan on staged changes
Write-Output "`n=== Secret Scan (staged changes) ==="
$staged = git diff --cached 2>$null
if ($staged) {
    $hits = $staged | Select-String -Pattern 'sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xoxb-|ghp_|"PRIVATE KEY"' -CaseSensitive:$false
    if ($hits) {
        Write-Output "POTENTIAL SECRET IN STAGED DIFF:"
        $hits | ForEach-Object { Write-Output "  $_" }
        $failed += 'Secret scan'
    } else {
        Write-Output "OK: no obvious secrets in staged changes"
    }
} else {
    Write-Output "(nothing staged)"
}

# Working tree status
Write-Output "`n=== Git status ==="
git status --short

Pop-Location

Write-Output "`n=== SUMMARY ==="
if ($failed.Count -eq 0) {
    Write-Output "All preflight checks passed. Safe to commit/push."
    exit 0
} else {
    Write-Output "FAILED: $($failed -join ', ')"
    exit 1
}
