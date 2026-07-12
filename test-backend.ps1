try {
    $r = Invoke-WebRequest -Uri "https://jworden-api.fly.dev/api/v1/features" -TimeoutSec 25 -UseBasicParsing
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host $r.Content
} catch {
    Write-Host "BACKEND ERROR: $_"
}

Write-Host "---"

try {
    $r2 = Invoke-WebRequest -Uri "https://jworden-api.fly.dev/api/v1/auth/status" -TimeoutSec 25 -UseBasicParsing
    Write-Host "AUTH STATUS: $($r2.StatusCode)"
    Write-Host $r2.Content
} catch {
    Write-Host "AUTH ERROR: $_"
}
