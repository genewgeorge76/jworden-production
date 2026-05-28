param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('organize-local', 'pull-dropbox', 'pull-google-photos', 'pull-google-drive', 'check-setup')]
  [string]$Action,

  [string]$InputDir,
  [string]$OutputRoot = 'public/work/imported',
  [string]$ManifestFile,
  [string]$ExportProjectsJson,

  [string]$DropboxToken,
  [string]$DropboxPath = '',

  [string]$GooglePhotosToken,
  [string]$GoogleAlbumId,

  [string]$GoogleDriveToken,
  [string]$GoogleDriveFolderId,

  [string]$LocationKeywords = 'Richmond,Chester,Midlothian,Henrico,Fairfax,Fredericksburg,Virginia,VA',
  [int]$MaxItems = 300,
  [switch]$IncludeVideos,
  [switch]$DryRun,
  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ImageExtensions = @('.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif')
$script:VideoExtensions = @('.mp4', '.mov', '.m4v')

# Keep explicit reference so ScriptAnalyzer treats this script parameter as used.
$null = $IncludeVideos

function Initialize-Directory {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Get-ConfigValue {
  param(
    [string]$Explicit,
    [string]$EnvName,
    [string]$Default = ''
  )

  if ($Explicit -and $Explicit.Trim().Length -gt 0) { return $Explicit }
  $envValue = [Environment]::GetEnvironmentVariable($EnvName)
  if ($envValue -and $envValue.Trim().Length -gt 0) { return $envValue }
  return $Default
}

function Get-SafeToken {
  param([string]$Value)
  if (-not $Value) { return 'unknown' }
  $clean = ($Value -replace '[^a-zA-Z0-9\-_ ]', ' ').Trim()
  if (-not $clean) { return 'unknown' }
  return (($clean -replace '\s+', '-') -replace '-{2,}', '-').ToLowerInvariant()
}

function ConvertFrom-ExifDate {
  param([string]$Value)
  if (-not $Value) { return $null }

  $trimmed = $Value.Trim([char]0).Trim()
  if (-not $trimmed) { return $null }

  $formats = @('yyyy:MM:dd HH:mm:ss', 'yyyy-MM-dd HH:mm:ss', 'yyyy:MM:dd HH:mm:ssK')
  foreach ($f in $formats) {
    try {
      return [DateTime]::ParseExact($trimmed, $f, [System.Globalization.CultureInfo]::InvariantCulture)
    } catch {
      Write-Verbose "EXIF date parse format miss for '$f'."
    }
  }

  try {
    return [DateTime]::Parse($trimmed)
  } catch {
    return $null
  }
}

function Get-Rational {
  param(
    [byte[]]$Bytes,
    [int]$Offset
  )

  if ($Offset + 7 -ge $Bytes.Length) { return 0.0 }

  $num = [BitConverter]::ToUInt32($Bytes, $Offset)
  $den = [BitConverter]::ToUInt32($Bytes, $Offset + 4)
  if ($den -eq 0) { return 0.0 }
  return [double]$num / [double]$den
}

function Get-GpsFromImage {
  param([System.Drawing.Image]$Image)

  $ids = @{}
  foreach ($id in $Image.PropertyIdList) { $ids[$id] = $true }

  if (-not ($ids.ContainsKey(1) -and $ids.ContainsKey(2) -and $ids.ContainsKey(3) -and $ids.ContainsKey(4))) {
    return $null
  }

  $latRef = [System.Text.Encoding]::ASCII.GetString($Image.GetPropertyItem(1).Value).Trim([char]0)
  $latVal = $Image.GetPropertyItem(2).Value
  $lonRef = [System.Text.Encoding]::ASCII.GetString($Image.GetPropertyItem(3).Value).Trim([char]0)
  $lonVal = $Image.GetPropertyItem(4).Value

  $latDeg = Get-Rational -Bytes $latVal -Offset 0
  $latMin = Get-Rational -Bytes $latVal -Offset 8
  $latSec = Get-Rational -Bytes $latVal -Offset 16

  $lonDeg = Get-Rational -Bytes $lonVal -Offset 0
  $lonMin = Get-Rational -Bytes $lonVal -Offset 8
  $lonSec = Get-Rational -Bytes $lonVal -Offset 16

  $lat = $latDeg + ($latMin / 60.0) + ($latSec / 3600.0)
  $lon = $lonDeg + ($lonMin / 60.0) + ($lonSec / 3600.0)

  if ($latRef -eq 'S') { $lat = -1 * $lat }
  if ($lonRef -eq 'W') { $lon = -1 * $lon }

  return [ordered]@{ latitude = [Math]::Round($lat, 6); longitude = [Math]::Round($lon, 6) }
}

function Get-ImageMeta {
  param([string]$FilePath)

  $fallbackDate = (Get-Item -LiteralPath $FilePath).LastWriteTime
  $meta = [ordered]@{
    timestamp = $fallbackDate
    gps = $null
  }

  try {
    Add-Type -AssemblyName System.Drawing | Out-Null
    $img = [System.Drawing.Image]::FromFile($FilePath)
    try {
      $ids = @{}
      foreach ($id in $img.PropertyIdList) { $ids[$id] = $true }

      $dateItem = $null
      if ($ids.ContainsKey(0x9003)) {
        $dateItem = $img.GetPropertyItem(0x9003)
      } elseif ($ids.ContainsKey(0x0132)) {
        $dateItem = $img.GetPropertyItem(0x0132)
      }

      if ($dateItem) {
        $dateText = [System.Text.Encoding]::ASCII.GetString($dateItem.Value)
        $parsed = ConvertFrom-ExifDate -Value $dateText
        if ($parsed) {
          $meta.timestamp = $parsed
        }
      }

      $gps = Get-GpsFromImage -Image $img
      if ($gps) { $meta.gps = $gps }
    } finally {
      $img.Dispose()
    }
  } catch {
    Write-Verbose "EXIF metadata unavailable for '$FilePath'; using file timestamp fallback."
  }

  return $meta
}

function Resolve-LocationToken {
  param(
    [string]$FilePath,
    [object]$Gps,
    [string[]]$KeywordList
  )

  $searchText = [IO.Path]::GetFileNameWithoutExtension($FilePath)

  foreach ($k in $KeywordList) {
    $key = $k.Trim()
    if (-not $key) { continue }
    if ($searchText -match [regex]::Escape($key)) {
      return Get-SafeToken -Value $key
    }
  }

  if ($Gps) {
    $lat = [Math]::Round([double]$Gps.latitude, 3)
    $lon = [Math]::Round([double]$Gps.longitude, 3)
    return "geo-$lat-$lon"
  }

  return 'unknown-location'
}

function Get-FileHashValue {
  param([string]$FilePath)
  try {
    return (Get-FileHash -LiteralPath $FilePath -Algorithm SHA256).Hash
  } catch {
    return ''
  }
}

function Build-ProjectImportItem {
  param(
    [hashtable]$Record
  )

  $category = 'commercial'
  $locText = $Record.location_token
  if ($locText -match 'driveway|residential') { $category = 'residential' }
  if ($locText -match 'church|hoa|municipal') { $category = 'municipal' }

  return [ordered]@{
    title = "Imported Project $($Record.timestamp_utc.Substring(0, 10))"
    description = "Imported by media-ingest CLI from $($Record.provider)."
    location = ($Record.location_token -replace '-', ' ')
    category = $category
    year = [DateTime]::Parse($Record.timestamp_utc).Year
    image_url = "/$($Record.relative_path -replace '\\', '/')"
    sqft = $null
  }
}

function Invoke-FileOrganization {
  param(
    [System.IO.FileInfo[]]$Files,
    [string]$Provider,
    [string]$OutputPath,
    [string[]]$KeywordList,
    [switch]$DryRunMode
  )

  Initialize-Directory -Path $OutputPath

  $records = @()
  foreach ($file in $Files) {
    $ext = $file.Extension.ToLowerInvariant()
    $isImage = $script:ImageExtensions -contains $ext
    $isVideo = $script:VideoExtensions -contains $ext

    if (-not $isImage -and -not ($IncludeVideos -and $isVideo)) {
      continue
    }

    $meta = if ($isImage) { Get-ImageMeta -FilePath $file.FullName } else { [ordered]@{ timestamp = $file.LastWriteTime; gps = $null } }
    $ts = [DateTime]$meta.timestamp

    $locationToken = Resolve-LocationToken -FilePath $file.FullName -Gps $meta.gps -KeywordList $KeywordList
    $dateFolder = Join-Path -Path $OutputPath -ChildPath (Join-Path -Path $ts.ToString('yyyy/MM/dd') -ChildPath $locationToken)
    Initialize-Directory -Path $dateFolder

    $baseName = Get-SafeToken -Value ([IO.Path]::GetFileNameWithoutExtension($file.Name))
    $destName = "{0}_{1}_{2}{3}" -f $ts.ToString('yyyyMMdd_HHmmss'), (Get-SafeToken -Value $Provider), $baseName, $ext
    $destPath = Join-Path -Path $dateFolder -ChildPath $destName

    if ((Test-Path -LiteralPath $destPath) -and -not $DryRunMode) {
      $existingHash = Get-FileHashValue -FilePath $destPath
      $incomingHash = Get-FileHashValue -FilePath $file.FullName
      if ($existingHash -eq $incomingHash) {
        continue
      }
      $destName = "{0}_{1}_{2}_{3}{4}" -f $ts.ToString('yyyyMMdd_HHmmss'), (Get-SafeToken -Value $Provider), $baseName, (Get-Random -Minimum 1000 -Maximum 9999), $ext
      $destPath = Join-Path -Path $dateFolder -ChildPath $destName
    }

    if (-not $DryRunMode) {
      Copy-Item -LiteralPath $file.FullName -Destination $destPath -Force
    }

    $relative = Resolve-Path -LiteralPath $destPath -Relative
    if (-not $relative) {
      $relative = $destPath
    }

    $records += [ordered]@{
      provider = $Provider
      source_file = $file.FullName
      destination_file = $destPath
      relative_path = ($relative -replace '^\.\\', '')
      timestamp_utc = $ts.ToUniversalTime().ToString('o')
      location_token = $locationToken
      gps = $meta.gps
      file_name = $destName
      file_extension = $ext
    }
  }

  return ,$records
}

function Get-DropboxItem {
  param(
    [string]$Token,
    [string]$Path,
    [int]$Limit,
    [string]$StagingDir
  )

  if (-not $Token) {
    throw 'Dropbox token is required for pull-dropbox action.'
  }

  Initialize-Directory -Path $StagingDir
  $headers = @{ Authorization = "Bearer $Token"; 'Content-Type' = 'application/json' }
  $listBody = @{ path = $Path; recursive = $true; include_non_downloadable_files = $false } | ConvertTo-Json

  $entries = @()
  $response = Invoke-RestMethod -Uri 'https://api.dropboxapi.com/2/files/list_folder' -Method Post -Headers $headers -Body $listBody
  $entries += @($response.entries)
  $cursor = $response.cursor

  while ($response.has_more -and $entries.Count -lt $Limit) {
    $continueBody = @{ cursor = $cursor } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'https://api.dropboxapi.com/2/files/list_folder/continue' -Method Post -Headers $headers -Body $continueBody
    $entries += @($response.entries)
    $cursor = $response.cursor
  }

  $fileEntries = $entries | Where-Object {
    $_.'.tag' -eq 'file' -and ( ($script:ImageExtensions -contains ([IO.Path]::GetExtension($_.name).ToLowerInvariant())) -or ($IncludeVideos -and ($script:VideoExtensions -contains ([IO.Path]::GetExtension($_.name).ToLowerInvariant()))) )
  } | Select-Object -First $Limit

  $downloadHeaders = @{ Authorization = "Bearer $Token" }
  $downloaded = @()

  foreach ($entry in $fileEntries) {
    $target = Join-Path -Path $StagingDir -ChildPath $entry.name
    $downloadHeaders['Dropbox-API-Arg'] = (@{ path = $entry.path_lower } | ConvertTo-Json -Compress)
    Invoke-WebRequest -Uri 'https://content.dropboxapi.com/2/files/download' -Method Post -Headers $downloadHeaders -OutFile $target | Out-Null
    $downloaded += Get-Item -LiteralPath $target
  }

  return ,$downloaded
}

function Get-GooglePhotosItem {
  param(
    [string]$Token,
    [string]$AlbumId,
    [int]$Limit,
    [string]$StagingDir
  )

  if (-not $Token) {
    throw 'Google Photos token is required for pull-google-photos action.'
  }

  Initialize-Directory -Path $StagingDir
  $headers = @{ Authorization = "Bearer $Token"; 'Content-Type' = 'application/json' }

  $items = @()
  $nextToken = $null

  do {
    if ($AlbumId) {
      $bodyObj = @{ albumId = $AlbumId; pageSize = 100 }
      if ($nextToken) { $bodyObj.pageToken = $nextToken }
      $body = $bodyObj | ConvertTo-Json
      $resp = Invoke-RestMethod -Uri 'https://photoslibrary.googleapis.com/v1/mediaItems:search' -Method Post -Headers $headers -Body $body
    } else {
      $uri = 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100'
      if ($nextToken) { $uri += "&pageToken=$nextToken" }
      $resp = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    }

    $items += @($resp.mediaItems)
    $nextToken = $resp.nextPageToken
  } while ($nextToken -and $items.Count -lt $Limit)

  $selected = $items | Where-Object {
    $_.mimeType -like 'image/*' -or ($IncludeVideos -and $_.mimeType -like 'video/*')
  } | Select-Object -First $Limit

  $downloaded = @()
  foreach ($item in $selected) {
    $fileName = if ($item.filename) { $item.filename } else { "$($item.id).jpg" }
    $target = Join-Path -Path $StagingDir -ChildPath $fileName

    $url = if ($item.mimeType -like 'video/*') {
      "$($item.baseUrl)=dv"
    } else {
      "$($item.baseUrl)=d"
    }

    Invoke-WebRequest -Uri $url -Method Get -OutFile $target | Out-Null

    # Preserve timestamp if Google metadata contains creation time.
    if ($item.mediaMetadata.creationTime) {
      try {
        $created = [DateTime]::Parse($item.mediaMetadata.creationTime)
        (Get-Item -LiteralPath $target).LastWriteTime = $created
      } catch {
        Write-Verbose "Unable to parse Google Photos creationTime for '$($item.filename)'."
      }
    }

    $downloaded += Get-Item -LiteralPath $target
  }

  return ,$downloaded
}

function Get-GoogleDriveItem {
  param(
    [string]$Token,
    [string]$FolderId,
    [int]$Limit,
    [string]$StagingDir
  )

  if (-not $Token) {
    throw 'Google Drive token is required for pull-google-drive action.'
  }

  Initialize-Directory -Path $StagingDir
  $headers = @{ Authorization = "Bearer $Token" }

  $mimeQuery = if ($IncludeVideos) {
    "(mimeType contains 'image/' or mimeType contains 'video/')"
  } else {
    "mimeType contains 'image/'"
  }

  $queryParts = @('trashed = false', $mimeQuery)
  if ($FolderId) {
    $queryParts += "'$FolderId' in parents"
  }

  $query = [string]::Join(' and ', $queryParts)
  $encodedQuery = [System.Uri]::EscapeDataString($query)
  $fields = [System.Uri]::EscapeDataString('nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,size)')

  $items = @()
  $nextToken = $null

  do {
    $uri = "https://www.googleapis.com/drive/v3/files?q=$encodedQuery&pageSize=100&fields=$fields&supportsAllDrives=true&includeItemsFromAllDrives=true"
    if ($nextToken) {
      $uri += '&pageToken=' + [System.Uri]::EscapeDataString($nextToken)
    }

    $resp = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    $items += @($resp.files)
    $nextToken = $resp.nextPageToken
  } while ($nextToken -and $items.Count -lt $Limit)

  $selected = $items | Select-Object -First $Limit
  $downloaded = @()

  foreach ($item in $selected) {
    $safeName = if ($item.name) { $item.name } else { "$($item.id).jpg" }
    $target = Join-Path -Path $StagingDir -ChildPath $safeName
    if (Test-Path -LiteralPath $target) {
      $base = [IO.Path]::GetFileNameWithoutExtension($safeName)
      $ext = [IO.Path]::GetExtension($safeName)
      $target = Join-Path -Path $StagingDir -ChildPath "$base-$($item.id)$ext"
    }

    $downloadUri = "https://www.googleapis.com/drive/v3/files/$($item.id)?alt=media&supportsAllDrives=true"
    Invoke-WebRequest -Uri $downloadUri -Method Get -Headers $headers -OutFile $target | Out-Null

    $timestamp = if ($item.createdTime) { $item.createdTime } else { $item.modifiedTime }
    if ($timestamp) {
      try {
        $created = [DateTime]::Parse($timestamp)
        (Get-Item -LiteralPath $target).LastWriteTime = $created
      } catch {
        Write-Verbose "Unable to parse Google Drive timestamp for '$($item.name)'."
      }
    }

    $downloaded += Get-Item -LiteralPath $target
  }

  return ,$downloaded
}

function Build-Result {
  param(
    [string]$ActionName,
    [string]$OutputPath,
    [object[]]$Records
  )

  $sorted = @($Records | Sort-Object timestamp_utc)
  $projects = @()
  $locations = @()
  foreach ($rec in $sorted) {
    $projects += Build-ProjectImportItem -Record $rec
    if ($rec.location_token) {
      $locations += $rec.location_token
    }
  }

  return [ordered]@{
    action = $ActionName
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
    output_root = $OutputPath
    total_files = $sorted.Count
    location_folders = @($locations | Sort-Object -Unique)
    records = $sorted
    project_import = $projects
  }
}

if (-not $ManifestFile) {
  $ManifestFile = Join-Path -Path $OutputRoot -ChildPath 'ingest-manifest.json'
}
if (-not $ExportProjectsJson) {
  $ExportProjectsJson = Join-Path -Path $OutputRoot -ChildPath 'project-import.json'
}

$ResolvedDropboxToken = Get-ConfigValue -Explicit $DropboxToken -EnvName 'DROPBOX_ACCESS_TOKEN'
$ResolvedDropboxPath = Get-ConfigValue -Explicit $DropboxPath -EnvName 'DROPBOX_PATH' -Default ''
$ResolvedGooglePhotosToken = Get-ConfigValue -Explicit $GooglePhotosToken -EnvName 'GOOGLE_PHOTOS_ACCESS_TOKEN'
$ResolvedGoogleAlbumId = Get-ConfigValue -Explicit $GoogleAlbumId -EnvName 'GOOGLE_PHOTOS_ALBUM_ID'
$ResolvedGoogleDriveToken = Get-ConfigValue -Explicit $GoogleDriveToken -EnvName 'GOOGLE_DRIVE_ACCESS_TOKEN'
$ResolvedGoogleDriveFolderId = Get-ConfigValue -Explicit $GoogleDriveFolderId -EnvName 'GOOGLE_DRIVE_FOLDER_ID'

$keywords = @($LocationKeywords -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
Initialize-Directory -Path $OutputRoot

$stagingRoot = Join-Path -Path 'scripts' -ChildPath '.tmp-media-ingest'
if (Test-Path -LiteralPath $stagingRoot) {
  Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}
Initialize-Directory -Path $stagingRoot

try {
  if ($Action -eq 'check-setup') {
    $setup = [ordered]@{
      action = 'check-setup'
      generated_at = (Get-Date).ToUniversalTime().ToString('o')
      output_root = $OutputRoot
      checks = [ordered]@{
        output_root_exists = (Test-Path -LiteralPath $OutputRoot)
        dropbox_token_present = [bool]($ResolvedDropboxToken)
        google_photos_token_present = [bool]($ResolvedGooglePhotosToken)
        google_photos_album_id_present = [bool]($ResolvedGoogleAlbumId)
        google_drive_token_present = [bool]($ResolvedGoogleDriveToken)
        google_drive_folder_id_present = [bool]($ResolvedGoogleDriveFolderId)
      }
      env_names = [ordered]@{
        dropbox_token = 'DROPBOX_ACCESS_TOKEN'
        dropbox_path = 'DROPBOX_PATH'
        google_photos_token = 'GOOGLE_PHOTOS_ACCESS_TOKEN'
        google_photos_album_id = 'GOOGLE_PHOTOS_ALBUM_ID'
        google_drive_token = 'GOOGLE_DRIVE_ACCESS_TOKEN'
        google_drive_folder_id = 'GOOGLE_DRIVE_FOLDER_ID'
      }
      next_steps = @(
        'Set Dropbox token in DROPBOX_ACCESS_TOKEN or pass -DropboxToken.',
        'Set Google Photos token in GOOGLE_PHOTOS_ACCESS_TOKEN or pass -GooglePhotosToken.',
        'Optional: Set GOOGLE_PHOTOS_ALBUM_ID to limit import to one album.',
        'Set Google Drive token in GOOGLE_DRIVE_ACCESS_TOKEN or pass -GoogleDriveToken.',
        'Optional: Set GOOGLE_DRIVE_FOLDER_ID to limit import to one Drive folder.',
        'Run pull command with -DryRun first to verify before writing files.'
      )
    }

    if ($Json) {
      $setup | ConvertTo-Json -Depth 8
    } else {
      Write-Output 'Media Ingest Setup Check'
      Write-Output "Output root exists: $($setup.checks.output_root_exists)"
      Write-Output "Dropbox token present: $($setup.checks.dropbox_token_present)"
      Write-Output "Google Photos token present: $($setup.checks.google_photos_token_present)"
      Write-Output "Google Photos album ID present: $($setup.checks.google_photos_album_id_present)"
      Write-Output "Google Drive token present: $($setup.checks.google_drive_token_present)"
      Write-Output "Google Drive folder ID present: $($setup.checks.google_drive_folder_id_present)"
      Write-Output 'Next steps:'
      foreach ($step in $setup.next_steps) {
        Write-Output "- $step"
      }
    }

    return
  }

  $provider = 'local'
  $files = @()

  switch ($Action) {
    'organize-local' {
      if (-not $InputDir -or -not (Test-Path -LiteralPath $InputDir)) {
        throw 'For organize-local, provide a valid -InputDir.'
      }

      $provider = 'local'
      $files = Get-ChildItem -LiteralPath $InputDir -File -Recurse
    }
    'pull-dropbox' {
      $provider = 'dropbox'
      $files = Get-DropboxItem -Token $ResolvedDropboxToken -Path $ResolvedDropboxPath -Limit $MaxItems -StagingDir (Join-Path -Path $stagingRoot -ChildPath 'dropbox')
    }
    'pull-google-photos' {
      $provider = 'google-photos'
      $files = Get-GooglePhotosItem -Token $ResolvedGooglePhotosToken -AlbumId $ResolvedGoogleAlbumId -Limit $MaxItems -StagingDir (Join-Path -Path $stagingRoot -ChildPath 'googlephotos')
    }
    'pull-google-drive' {
      $provider = 'google-drive'
      $files = Get-GoogleDriveItem -Token $ResolvedGoogleDriveToken -FolderId $ResolvedGoogleDriveFolderId -Limit $MaxItems -StagingDir (Join-Path -Path $stagingRoot -ChildPath 'googledrive')
    }
  }

  $records = Invoke-FileOrganization -Files $files -Provider $provider -OutputPath $OutputRoot -KeywordList $keywords -DryRunMode:$DryRun
  $result = Build-Result -ActionName $Action -OutputPath $OutputRoot -Records $records

  if (-not $DryRun) {
    $result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $ManifestFile -Encoding UTF8
    $result.project_import | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ExportProjectsJson -Encoding UTF8
  }

  if ($Json) {
    $result | ConvertTo-Json -Depth 10
  } else {
    Write-Output "Action: $Action"
    Write-Output "Provider: $provider"
    Write-Output "Files organized: $($result.total_files)"
    Write-Output "Output root: $OutputRoot"
    Write-Output "Manifest: $ManifestFile"
    Write-Output "Project import: $ExportProjectsJson"
    Write-Output "Locations: $([string]::Join(', ', $result.location_folders))"
  }
} finally {
  if (Test-Path -LiteralPath $stagingRoot) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
  }
}
