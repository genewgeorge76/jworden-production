param(
  [ValidateSet('core', 'ai', 'media', 'observability', 'all')]
  [string]$Target = 'all',

  [ValidateSet('railway', 'netlify', 'local', 'all')]
  [string]$Provider = 'all',

  [string]$RailwayService = 'codexbuildfreeofbase44',
  [string]$RailwayEnvironment = 'production',
  [string]$NetlifySiteId = 'da1c274c-cd8c-4080-bbbb-5ad79f448f18',
  [ValidateSet('Process', 'User')]
  [string]$LocalScope = 'User',
  [string]$InputFile = '',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$InputValues = @{}

# Keep explicit references so ScriptAnalyzer treats these script parameters as used.
$null = $RailwayService, $RailwayEnvironment, $NetlifySiteId, $LocalScope

function Write-Step {
  param([string]$Message)
  Write-Output "[ops-secrets] $Message"
}

function Import-InputFile {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (-not (Test-Path $Path)) {
    throw "Input file not found: $Path"
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $parts = $line.Split('=', 2)
    if ($parts.Count -ne 2) { return }
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($value)) { return }
    if ($value -match '^(PASTE_|YOUR_|TODO|CHANGEME)') { return }
    $script:InputValues[$name] = $value
  }

  Write-Step "Loaded $($InputValues.Count) filled value(s) from $Path. Values will not be printed."
}

function Test-GroupIncluded {
  param([string]$Group)
  return $Target -eq 'all' -or $Target -eq $Group
}

function Test-ProviderSelected {
  param([string]$Name)
  return $Provider -eq 'all' -or $Provider -eq $Name
}

function ConvertTo-PlainText {
  param([securestring]$SecureValue)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    if ($ptr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
  }
}

function Read-SecretValue {
  param(
    [string]$Name,
    [string]$Description
  )

  if ($InputValues.ContainsKey($Name)) {
    Write-Step "Using $Name from input file."
    return [string]$InputValues[$Name]
  }

  if ($InputFile) {
    Write-Step "Skipped $Name because it is blank or missing in $InputFile."
    return $null
  }

  Write-Output ""
  Write-Output "$Name - $Description"
  $secure = Read-Host "Enter value, or leave blank to skip" -AsSecureString
  if ($secure.Length -eq 0) {
    return $null
  }
  return ConvertTo-PlainText $secure
}

function Read-PlainValue {
  param(
    [string]$Name,
    [string]$Description,
    [string]$DefaultValue = ''
  )

  if ($InputValues.ContainsKey($Name)) {
    Write-Step "Using $Name from input file."
    return [string]$InputValues[$Name]
  }

  if ($InputFile) {
    Write-Step "Skipped $Name because it is blank or missing in $InputFile."
    return $null
  }

  Write-Output ""
  Write-Output "$Name - $Description"
  if ($DefaultValue) {
    $value = Read-Host "Enter value, leave blank for '$DefaultValue', or type SKIP"
    if ($value -eq 'SKIP') { return $null }
    if ([string]::IsNullOrWhiteSpace($value)) { return $DefaultValue }
    return $value.Trim()
  }

  $value = Read-Host "Enter value, or leave blank to skip"
  if ([string]::IsNullOrWhiteSpace($value)) { return $null }
  return $value.Trim()
}

function Invoke-RailwaySet {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($DryRun) {
    Write-Step "Would set Railway $Name for service '$script:RailwayService' in '$script:RailwayEnvironment'."
    return
  }

  $Value | & npx -y @railway/cli variable set $Name --stdin --service $script:RailwayService --environment $script:RailwayEnvironment | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Railway variable set failed for $Name."
  }
}

function Invoke-NetlifySet {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($DryRun) {
    Write-Step "Would set Netlify $Name for site '$script:NetlifySiteId'."
    return
  }

  $netlifyArgs = @(
    '-y',
    'netlify',
    'env:set',
    $Name,
    $Value,
    '--context',
    'production',
    '--site',
    $script:NetlifySiteId,
    '--secret',
    '--force'
  )
  & npx @netlifyArgs | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Netlify variable set failed for $Name."
  }
}

function Invoke-LocalEnvironmentSync {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($DryRun) {
    Write-Step "Would set local $script:LocalScope env $Name."
    return
  }

  [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
  if ($script:LocalScope -eq 'User') {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
  }
  Write-Step "Set local $script:LocalScope env $Name. Open a new terminal for User-scope values to appear automatically."
}

function Add-SecretEntry {
  param(
    [string]$Group,
    [string]$Name,
    [string]$Description,
    [string[]]$Destinations
  )

  if (-not (Test-GroupIncluded $Group)) { return }
  $value = Read-SecretValue -Name $Name -Description $Description
  if ($null -eq $value) {
    Write-Step "Skipped $Name."
    return
  }
  Invoke-EntryDispatch -Name $Name -Value $value -Destinations $Destinations
}

function Add-PlainEntry {
  param(
    [string]$Group,
    [string]$Name,
    [string]$Description,
    [string[]]$Destinations,
    [string]$DefaultValue = ''
  )

  if (-not (Test-GroupIncluded $Group)) { return }
  $value = Read-PlainValue -Name $Name -Description $Description -DefaultValue $DefaultValue
  if ($null -eq $value) {
    Write-Step "Skipped $Name."
    return
  }
  Invoke-EntryDispatch -Name $Name -Value $value -Destinations $Destinations
}

function Invoke-EntryDispatch {
  param(
    [string]$Name,
    [string]$Value,
    [string[]]$Destinations
  )

  foreach ($destination in $Destinations) {
    switch ($destination) {
      'railway' { if (Test-ProviderSelected 'railway') { Invoke-RailwaySet -Name $Name -Value $Value } }
      'netlify' { if (Test-ProviderSelected 'netlify') { Invoke-NetlifySet -Name $Name -Value $Value } }
      'local' { if (Test-ProviderSelected 'local') { Invoke-LocalEnvironmentSync -Name $Name -Value $Value } }
      default { throw "Unknown destination '$destination' for $Name." }
    }
  }
}

Write-Step "Target=$Target Provider=$Provider DryRun=$DryRun"
Write-Step "Blank secret prompts are skipped. Nothing is written to .env or git."
Import-InputFile -Path $InputFile

Add-PlainEntry -Group 'core' -Name 'AUTO_CREATE_TABLES' -Description 'Production should use Alembic migrations instead of startup table creation.' -Destinations @('railway') -DefaultValue 'false'
Add-PlainEntry -Group 'core' -Name 'LOG_FORMAT' -Description 'Use JSON logs in production.' -Destinations @('railway') -DefaultValue 'json'
Add-PlainEntry -Group 'core' -Name 'LOG_LEVEL' -Description 'Minimum backend log level.' -Destinations @('railway') -DefaultValue 'INFO'
Add-PlainEntry -Group 'core' -Name 'EXTRA_CORS_ORIGINS' -Description 'Comma-separated allowed browser origins.' -Destinations @('railway') -DefaultValue 'https://www.jwordenasphaltpaving.com,https://jwordenasphaltpaving.com'
Add-PlainEntry -Group 'core' -Name 'VITE_API_BASE_URL' -Description 'Frontend API base URL.' -Destinations @('netlify') -DefaultValue 'https://codexbuildfreeofbase44-production.up.railway.app'
Add-PlainEntry -Group 'core' -Name 'USE_BACKEND_TOKEN_ENDPOINT' -Description 'Netlify function should exchange master key via backend token endpoint.' -Destinations @('netlify') -DefaultValue 'true'
Add-SecretEntry -Group 'core' -Name 'JWORDEN_MASTER_KEY' -Description 'Backend master API key. Set the same value in Railway and Netlify.' -Destinations @('railway', 'netlify')
Add-SecretEntry -Group 'core' -Name 'JWT_SECRET_KEY' -Description 'JWT signing secret. Set in Railway; Netlify only needs it if USE_BACKEND_TOKEN_ENDPOINT=false.' -Destinations @('railway')
Add-PlainEntry -Group 'core' -Name 'ADMIN_USERNAME' -Description 'Admin dashboard username.' -Destinations @('railway') -DefaultValue 'admin'
Add-SecretEntry -Group 'core' -Name 'ADMIN_PASSWORD' -Description 'Admin dashboard password.' -Destinations @('railway')
Add-SecretEntry -Group 'ai' -Name 'OPENAI_API_KEY' -Description 'OpenAI key for chat, photo inspection, document intelligence, blog drafts, and analytics AI.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'GEMINI_API_KEY' -Description 'Optional Gemini provider key for planned multi-provider AI routing.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'ANTHROPIC_API_KEY' -Description 'Optional Anthropic provider key for planned multi-provider AI routing.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'PERPLEXITY_API_KEY' -Description 'Optional Perplexity provider key for web-grounded research.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'XAI_API_KEY' -Description 'Optional xAI provider key for Grok routing.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'TAVILY_API_KEY' -Description 'Tavily key for Jarvis web_search tool and readiness checks.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'ELEVENLABS_API_KEY' -Description 'Optional ElevenLabs voice synthesis key for premium Jarvis TTS.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'GOOGLE_API_KEY' -Description 'Google Maps/Places/geocoding key. Restrict browser variants by domain in Google Cloud.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'VITE_GOOGLE_MAPS_API_KEY' -Description 'Browser-safe Google Maps key for frontend maps. Must be domain-restricted.' -Destinations @('netlify')
Add-SecretEntry -Group 'ai' -Name 'VAPI_API_KEY' -Description 'Vapi key for Jarvis outbound phone calls.' -Destinations @('railway', 'local')
Add-PlainEntry -Group 'ai' -Name 'VAPI_ASSISTANT_ID' -Description 'Vapi assistant id used for outbound calls.' -Destinations @('railway', 'local')
Add-PlainEntry -Group 'ai' -Name 'VAPI_PHONE_NUMBER_ID' -Description 'Vapi phone number id used for outbound calls.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'SENDGRID_API_KEY' -Description 'SendGrid key for Jarvis and lead transactional emails.' -Destinations @('railway', 'local')
Add-PlainEntry -Group 'ai' -Name 'SENDGRID_FROM_EMAIL' -Description 'Verified SendGrid from address for outbound emails.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'TWILIO_ACCOUNT_SID' -Description 'Twilio account SID for SMS + Verify workflows.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'ai' -Name 'TWILIO_AUTH_TOKEN' -Description 'Twilio auth token for SMS + Verify workflows.' -Destinations @('railway', 'local')
Add-PlainEntry -Group 'ai' -Name 'TWILIO_VERIFY_SERVICE_SID' -Description 'Twilio Verify service SID (required for /api/v1/twilio/verify).' -Destinations @('railway', 'local')
Add-PlainEntry -Group 'ai' -Name 'TWILIO_FROM_NUMBER' -Description 'Twilio sender number in E.164 format (for direct SMS notifications).' -Destinations @('railway', 'local')
Add-PlainEntry -Group 'ai' -Name 'ADMIN_2FA_PHONE' -Description 'Admin phone in E.164 for Twilio Verify admin OTP endpoint.' -Destinations @('railway', 'local')
Add-SecretEntry -Group 'observability' -Name 'SENTRY_DSN' -Description 'Backend Sentry DSN.' -Destinations @('railway')
Add-SecretEntry -Group 'observability' -Name 'VITE_SENTRY_DSN' -Description 'Frontend Sentry DSN.' -Destinations @('netlify')
Add-SecretEntry -Group 'observability' -Name 'DATADOG_API_KEY' -Description 'Datadog metrics API key.' -Destinations @('railway')
Add-SecretEntry -Group 'observability' -Name 'SLACK_WEBHOOK_URL' -Description 'Slack incoming webhook for operational alerts.' -Destinations @('railway')
Add-SecretEntry -Group 'observability' -Name 'RESEND_API_KEY' -Description 'Resend transactional email API key.' -Destinations @('railway')
Add-PlainEntry -Group 'observability' -Name 'RESEND_FROM_EMAIL' -Description 'Verified sender email address for customer and operations email.' -Destinations @('railway')
Add-PlainEntry -Group 'observability' -Name 'DD_ENV' -Description 'Datadog environment tag.' -Destinations @('railway') -DefaultValue 'production'
Add-PlainEntry -Group 'observability' -Name 'DD_SERVICE' -Description 'Datadog service tag.' -Destinations @('railway') -DefaultValue 'jworden-api'
Add-SecretEntry -Group 'media' -Name 'DROPBOX_ACCESS_TOKEN' -Description 'Local Dropbox import token. Stored only in this process by default.' -Destinations @('local')
Add-PlainEntry -Group 'media' -Name 'DROPBOX_PATH' -Description 'Optional Dropbox folder path to import from.' -Destinations @('local') -DefaultValue '/Work Photos'
Add-SecretEntry -Group 'media' -Name 'GOOGLE_PHOTOS_ACCESS_TOKEN' -Description 'Local Google Photos OAuth token.' -Destinations @('local')
Add-PlainEntry -Group 'media' -Name 'GOOGLE_PHOTOS_ALBUM_ID' -Description 'Optional Google Photos album ID to limit imports.' -Destinations @('local')
Add-SecretEntry -Group 'media' -Name 'GOOGLE_DRIVE_ACCESS_TOKEN' -Description 'Local Google Drive OAuth token.' -Destinations @('local')
Add-PlainEntry -Group 'media' -Name 'GOOGLE_DRIVE_FOLDER_ID' -Description 'Optional Drive folder ID to limit imports.' -Destinations @('local')

Write-Step "Done. Railway and Netlify may redeploy after variable changes."