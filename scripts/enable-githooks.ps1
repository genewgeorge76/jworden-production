# scripts/enable-githooks.ps1
# One-time setup: point git at the .githooks/ folder so pre-commit and pre-push run automatically.
# Run from repo root:   .\scripts\enable-githooks.ps1

Push-Location (Split-Path $PSScriptRoot -Parent)

git config core.hooksPath .githooks

if ($LASTEXITCODE -eq 0) {
    Write-Output "OK: git hooks enabled. .githooks/pre-commit and .githooks/pre-push will now run automatically."
    Write-Output ""
    Write-Output "Verify with:  git config --get core.hooksPath"
    Write-Output "Disable with: git config --unset core.hooksPath"
} else {
    Write-Output "FAILED to set core.hooksPath"
    exit 1
}

Pop-Location
