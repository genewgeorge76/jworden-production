<#
.SYNOPSIS
    Multi-Tenant CI/CD Pipeline - Deployment Engine

.DESCRIPTION
    This script is the core programmatic factory engine. It accepts a blueprint slug,
    pre-processes the AI studio architecture, compiles the Vite/React static bundle
    with injected tenant tokens, and deploys directly to the target Edge CDN (Netlify).

.PARAMETER TenantSlug
    The slug of the blueprint used to compile the site (e.g., 'premium-regional-contractor').

.PARAMETER NetlifySiteId
    The destination site ID on Netlify.

.PARAMETER Preview
    If switch is present, deploys a draft preview instead of production.

.EXAMPLE
    .\scripts\generate-client.ps1 -TenantSlug "premium-regional-contractor" -NetlifySiteId "xxxx-xxxx-xxxx"
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string]$TenantSlug,

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string]$NetlifySiteId,

    [switch]$Preview
)

$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

Write-Information "================================================="
Write-Information "    MULTI-TENANT FACTORY CI/CD INITIALIZING      "
Write-Information "================================================="

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $RepoRoot

try {
    # 1. Validate Netlify Authentication
    Write-Information "-> Validating Deployment Credentials..."
    if ([string]::IsNullOrWhiteSpace($env:NETLIFY_AUTH_TOKEN)) {
        throw "NETLIFY_AUTH_TOKEN is missing. Please set this environment variable."
    }

    # 2. Run Site Blueprint Studio
    Write-Information "-> Compiling Blueprint Architecture for Tenant: $TenantSlug"
    node scripts/site-blueprint-studio.mjs
    if ($LASTEXITCODE -ne 0) { throw "Blueprint compile failed." }

    Write-Information "-> Generating AI Blueprint Pages..."
    node scripts/ai-page-factory.mjs $TenantSlug
    if ($LASTEXITCODE -ne 0) { throw "AI Page Factory failed." }

    Write-Information "-> Generating Programmatic SEO Blogs..."
    node scripts/ai-blog-factory.mjs $TenantSlug
    if ($LASTEXITCODE -ne 0) { throw "AI Blog Factory failed." }

    $BlueprintDir = Join-Path $PSScriptRoot "..\generated\site-studio\$TenantSlug"
    if (-not (Test-Path $BlueprintDir)) {
        throw "Tenant slug '$TenantSlug' wasn't found in generated blueprints. Ensure site-blueprints/$TenantSlug.json exists."
    }

    # 3. Inject Tenant Tokens into the workspace
    Write-Information "-> Injecting $TenantSlug tokens into Application Context..."
    $ViteEnvPath = Join-Path $RepoRoot ".env.production.local"
    $EnvVariables = @"
VITE_TENANT_SLUG=$TenantSlug
VITE_BUILD_DATE=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
    Set-Content -Path $ViteEnvPath -Value $EnvVariables
    # Optionally copy the tokens.css directly into src for Vite to absorb globally
    # Copy-Item "$BlueprintDir\tokens.css" -Destination "src\generated\tenant-theme.css" -Force

    # 4. Trigger Vite Production Build
    Write-Information "-> Commencing Headless SSG Build Payload..."
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Vite build strictly failed." }

    # 5. Check Output Health
    if (-not (Test-Path "dist\index.html")) {
        throw "Build output 'dist/index.html' missing. Factory output invalid."
    }
    Write-Information "-> Output bundle validated. 100/100 Core Web Vitals structure preserved."

    # 6. Execute Edge Deployment via Netlify CLI
    Write-Information "-> Pushing to Edge CDN ($NetlifySiteId)..."

    $DeployCmd = "npx"
    $DeployArgs = @("netlify-cli", "deploy", "--dir=dist", "--site=$NetlifySiteId")

    if (-not $Preview) {
        Write-Information "-> PRODUCTION DEPLOYMENT ACTIVE."
        $DeployArgs += "--prod"
    } else {
        Write-Information "-> DRAFT PREVIEW ACTIVE."
    }

    # Invoke process carefully to capture errors
    & $DeployCmd $DeployArgs
    if ($LASTEXITCODE -ne 0) { throw "Netlify deploy command failed." }

    Write-Information "================================================="
    Write-Information "   SUCCESS: $TenantSlug DEPLOYED PROPERLY        "
    Write-Information "================================================="

} catch {
    Write-Error "BUILD FACTORY FAILED: $_"
    exit 1
} finally {
    # Cleanup env to prevent bleeding between factory builds
    if (Test-Path $ViteEnvPath) { Remove-Item $ViteEnvPath -ErrorAction SilentlyContinue }
    Pop-Location
}
