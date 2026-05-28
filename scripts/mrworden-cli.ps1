param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('format-response', 'extract-signals', 'score-intent', 'qualify', 'batch-qualify')]
  [string]$Action,

  [string]$Text,

  [string]$InputFile,

  [string]$InputDir,

  [string]$OutputFile,

  [int]$Top = 10,

  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-SourceText {
  param(
    [string]$DirectText,
    [string]$FilePath
  )

  if ($DirectText -and $DirectText.Trim().Length -gt 0) {
    return $DirectText
  }

  if ($FilePath -and (Test-Path -LiteralPath $FilePath)) {
    return (Get-Content -LiteralPath $FilePath -Raw)
  }

  throw "Provide -Text or -InputFile."
}

function Split-Sentence {
  param([string]$Content)

  if (-not $Content) { return @() }
  return ($Content -replace '\s+', ' ').Trim() -split '(?<=[.!?])\s+'
}

function Get-SurfaceType {
  param([string]$Content)

  $t = if ($null -eq $Content) { '' } else { $Content }
  $t = $t.ToLowerInvariant()
  if ($t -match 'parking\s*lot|lot') { return 'parking_lot' }
  if ($t -match 'driveway') { return 'driveway' }
  if ($t -match 'road|street|lane|private\s*road') { return 'roadway' }
  if ($t -match 'church') { return 'church_lot' }
  if ($t -match 'hoa') { return 'hoa' }
  return 'asphalt'
}

function Get-Urgency {
  param([string]$Content)

  $t = if ($null -eq $Content) { '' } else { $Content }
  $t = $t.ToLowerInvariant()
  if ($t -match 'asap|urgent|this week|immediately|right away|emergency') { return 'urgent' }
  if ($t -match 'this month|soon|next week|next month') { return 'standard' }
  return 'flexible'
}

function Get-LeadSignal {
  param([string]$Content)

  $email = [regex]::Match($Content, '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', 'IgnoreCase').Value
  $phone = [regex]::Match($Content, '(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}').Value
  $sqftMatch = [regex]::Match($Content, '(\d{3,6})\s*(?:sq\s*ft|sqft|square\s*feet)', 'IgnoreCase')
  $nameMatch = [regex]::Match($Content, '(?:i\s*am|this\s*is|my\s*name\s*is)\s+([A-Za-z][A-Za-z''\-\s]{1,40})', 'IgnoreCase')
  $addressMatch = [regex]::Match($Content, '\d{2,6}\s+[A-Za-z0-9.\-\s]{3,80}(?:rd|road|st|street|ave|avenue|dr|drive|blvd|lane|ln|ct|court)\b', 'IgnoreCase')

  $sqft = $null
  if ($sqftMatch.Success) {
    $sqft = [int]$sqftMatch.Groups[1].Value
  }

  return [ordered]@{
    name = if ($nameMatch.Success) { $nameMatch.Groups[1].Value.Trim() } else { $null }
    email = if ($email) { $email.Trim() } else { $null }
    phone = if ($phone) { $phone.Trim() } else { $null }
    address = if ($addressMatch.Success) { $addressMatch.Value.Trim() } else { $null }
    sqft = $sqft
    urgency = Get-Urgency -Content $Content
    surface_type = Get-SurfaceType -Content $Content
  }
}

function Get-IntentScore {
  param(
    [string]$Content,
    [hashtable]$Signals
  )

  $t = if ($null -eq $Content) { '' } else { $Content }
  $t = $t.ToLowerInvariant()
  $score = 30

  if ($Signals.phone) { $score += 20 }
  if ($Signals.email) { $score += 12 }
  if ($Signals.address) { $score += 10 }
  if ($Signals.sqft) { $score += 12 }

  if ($t -match 'quote|estimate|price|cost|bid') { $score += 10 }
  if ($t -match 'book|schedule|start|when can you') { $score += 10 }
  if ($Signals.urgency -eq 'urgent') { $score += 15 }
  if ($t -match 'call me|call now|phone me') { $score += 12 }

  if ($score -gt 100) { $score = 100 }
  if ($score -lt 0) { $score = 0 }

  $tier = if ($score -ge 85) {
    'hot'
  } elseif ($score -ge 65) {
    'warm'
  } elseif ($score -ge 40) {
    'cool'
  } else {
    'cold'
  }

  return [ordered]@{ score = $score; tier = $tier }
}

function Format-FounderResponse {
  param([string]$Content)

  $sentences = Split-Sentence -Content $Content

  $recommendation = if ($sentences.Count -gt 0) { $sentences[0] } else { 'Start with a free on-site inspection so we solve root issues first.' }
  $why = if ($sentences.Count -gt 1) { $sentences[1] } else { 'That protects your budget by matching the fix to real pavement conditions.' }
  $scope = if ($sentences.Count -gt 2) { $sentences[2] } else { 'We can compare targeted repair, overlay, and full replacement based on condition and base stability.' }

  $priceSentence = $sentences | Where-Object { $_ -match '\$|sq\s*ft|sqft|square\s*feet|price|cost' } | Select-Object -First 1
  if (-not $priceSentence) {
    $priceSentence = 'Pricing depends on square footage, prep depth, thickness, drainage, and access constraints.'
  }

  $timelineSentence = $sentences | Where-Object { $_ -match 'day|week|timeline|schedule|start' } | Select-Object -First 1
  if (-not $timelineSentence) {
    $timelineSentence = 'Most projects can be scoped quickly and scheduled by urgency and weather window.'
  }

  $nextStep = if ($sentences.Count -gt 3) {
    $sentences[-1]
  } else {
    'Share your address, approximate size, and target timeline and I will map your smartest next step.'
  }

  return (
    "Recommendation: $($recommendation.TrimEnd('.')). " +
    "Why: $($why.TrimEnd('.')). " +
    "Scope options: $($scope.TrimEnd('.')). " +
    "Price range context: $($priceSentence.TrimEnd('.')). " +
    "Timeline: $($timelineSentence.TrimEnd('.')). " +
    "Next step: $($nextStep.TrimEnd('.')). " +
    "- Mr. Worden, Founder"
  )
}

function Invoke-Qualification {
  param(
    [string]$Content,
    [string]$Source = 'inline'
  )

  $signals = Get-LeadSignal -Content $Content
  $intent = Get-IntentScore -Content $Content -Signals $signals
  $statusTarget = if ($intent.tier -in @('hot', 'warm')) { 'contacted' } else { 'new' }
  $nextAction = if ($intent.tier -eq 'hot') {
    'Call in under 5 minutes and send quote intake link immediately.'
  } elseif ($intent.tier -eq 'warm') {
    'Call same day and send scope options with estimate CTA.'
  } elseif ($intent.tier -eq 'cool') {
    'Send educational follow-up and request missing project details.'
  } else {
    'Add to nurture cadence and request timing + budget context.'
  }

  return [ordered]@{
    source = $Source
    intent = $intent
    signals = $signals
    status_target = $statusTarget
    next_action = $nextAction
    has_strong_identity = [bool]($signals.phone -or $signals.email -or $signals.address)
    recommended_followup = if ($intent.tier -in @('hot', 'warm')) {
      'Immediate human follow-up recommended (call + quote link).'
    } else {
      'Nurture with educational follow-up and ask for property details.'
    }
    structured_response = Format-FounderResponse -Content $Content
  }
}

function Invoke-BatchQualification {
  param(
    [string]$Directory,
    [string]$ExportPath,
    [int]$TopCount
  )

  if (-not $Directory -or -not (Test-Path -LiteralPath $Directory)) {
    throw "Provide a valid -InputDir for batch-qualify."
  }

  $files = Get-ChildItem -LiteralPath $Directory -File -Recurse |
    Where-Object { $_.Extension -in @('.txt', '.md', '.log', '.json') }

  if (-not $files -or $files.Count -eq 0) {
    throw "No supported files found in '$Directory'. Add .txt/.md/.log/.json files."
  }

  $results = @()
  foreach ($f in $files) {
    try {
      $content = Get-Content -LiteralPath $f.FullName -Raw
      if (-not $content -or $content.Trim().Length -eq 0) { continue }

      $qualified = Invoke-Qualification -Content $content -Source $f.FullName
      $results += $qualified
    } catch {
      Write-Warning "Skipping file due to read/parse issue: $($f.FullName)"
    }
  }

  if (-not $results -or $results.Count -eq 0) {
    throw "No valid qualification results generated from '$Directory'."
  }

  $ranked = $results | Sort-Object { $_.intent.score } -Descending
  $topLeads = $ranked | Select-Object -First $TopCount

  $tierCounts = [ordered]@{ hot = 0; warm = 0; cool = 0; cold = 0 }
  foreach ($item in $ranked) {
    $tier = $item.intent.tier
    if ($tierCounts.Contains($tier)) { $tierCounts[$tier] += 1 }
  }

  $summary = [ordered]@{
    analyzed_at = (Get-Date).ToString('o')
    directory = (Resolve-Path -LiteralPath $Directory).Path
    total_records = $ranked.Count
    tier_counts = $tierCounts
    top_priority = $topLeads
    autopilot_queue = @($ranked | Where-Object { $_.intent.tier -in @('hot', 'warm') } | Select-Object -First ([Math]::Max(1, $TopCount)))
  }

  if ($ExportPath) {
    $outDir = Split-Path -Path $ExportPath -Parent
    if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
      New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    $summary | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $ExportPath -Encoding UTF8
  }

  return $summary
}

if ($Action -eq 'batch-qualify') {
  $result = Invoke-BatchQualification -Directory $InputDir -ExportPath $OutputFile -TopCount $Top
} else {
  $content = Get-SourceText -DirectText $Text -FilePath $InputFile
  $signals = Get-LeadSignal -Content $content
  $intent = Get-IntentScore -Content $content -Signals $signals

  switch ($Action) {
    'format-response' {
      $result = [ordered]@{
        action = $Action
        response = Format-FounderResponse -Content $content
      }
    }
    'extract-signals' {
      $result = [ordered]@{
        action = $Action
        signals = $signals
      }
    }
    'score-intent' {
      $result = [ordered]@{
        action = $Action
        intent = $intent
      }
    }
    'qualify' {
      $qualified = Invoke-Qualification -Content $content
      $result = [ordered]@{
        action = $Action
        signals = $qualified.signals
        intent = $qualified.intent
        status_target = $qualified.status_target
        next_action = $qualified.next_action
        has_strong_identity = $qualified.has_strong_identity
        recommended_followup = $qualified.recommended_followup
        structured_response = $qualified.structured_response
      }
    }
  }
}

if ($Json) {
  $result | ConvertTo-Json -Depth 8
} else {
  switch ($Action) {
    'format-response' {
      Write-Output $result.response
    }
    'extract-signals' {
      Write-Output "Name: $($result.signals.name)"
      Write-Output "Email: $($result.signals.email)"
      Write-Output "Phone: $($result.signals.phone)"
      Write-Output "Address: $($result.signals.address)"
      Write-Output "SqFt: $($result.signals.sqft)"
      Write-Output "Urgency: $($result.signals.urgency)"
      Write-Output "Surface: $($result.signals.surface_type)"
    }
    'score-intent' {
      Write-Output "Score: $($result.intent.score)"
      Write-Output "Tier: $($result.intent.tier)"
    }
    'qualify' {
      Write-Output "Score: $($result.intent.score) [$($result.intent.tier)]"
      Write-Output "Target status: $($result.status_target)"
      Write-Output "Next action: $($result.next_action)"
      Write-Output "Strong identity: $($result.has_strong_identity)"
      Write-Output "Follow-up: $($result.recommended_followup)"
      Write-Output ""
      Write-Output $result.structured_response
    }
    'batch-qualify' {
      Write-Output "Analyzed: $($result.total_records) records"
      Write-Output "Hot: $($result.tier_counts.hot)"
      Write-Output "Warm: $($result.tier_counts.warm)"
      Write-Output "Cool: $($result.tier_counts.cool)"
      Write-Output "Cold: $($result.tier_counts.cold)"
      Write-Output ""
      Write-Output "Top priorities:"
      foreach ($lead in $result.top_priority) {
        Write-Output "- $($lead.source): score $($lead.intent.score) [$($lead.intent.tier)] -> $($lead.next_action)"
      }
      Write-Output ""
      Write-Output "Autopilot queue size: $($result.autopilot_queue.Count)"
      if ($OutputFile) {
        Write-Output ""
        Write-Output "Exported summary: $OutputFile"
      }
    }
  }
}
