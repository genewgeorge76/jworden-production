$ErrorActionPreference = "Continue"

$vars = @{
    "VITE_API_BASE_URL"       = "https://jworden-api.fly.dev"
    "VITE_SITE_URL"           = "https://jwordenasphaltpaving.com"
    "VITE_GA4_ID"             = "G-XXXXXXXXXX"
    "VITE_GOOGLE_PLACE_ID"    = "ChIJG3X8o_OStokRzRynNBuVfQ0"
    "VITE_GADS_CONVERSION_ID" = "AW-1410045668"
}

foreach ($name in $vars.Keys) {
    $val = $vars[$name]
    Write-Host "Setting $name = $val"
    vercel env rm $name production --yes 2>$null
    $val | vercel env add $name production
}

Write-Host "Done setting env vars."
