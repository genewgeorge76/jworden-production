$directories = @(
    "C:\Users\genew\Pictures",
    "C:\Users\genew\Downloads",
    "C:\Users\genew\Desktop",
    "C:\Users\genew\Documents"
)

$patterns = @(
    "*asphalt*.jpg", "*asphalt*.png", "*asphalt*.jpeg",
    "*pave*.jpg", "*pave*.png", "*pave*.jpeg",
    "*driveway*.jpg", "*driveway*.png", "*driveway*.jpeg",
    "*sealcoat*.jpg", "*sealcoat*.png",
    "*blacktop*.jpg", "*blacktop*.png"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "Searching in $dir..."
        Get-ChildItem -Path $dir -Recurse -Include $patterns -ErrorAction SilentlyContinue | Select-Object FullName
    }
}
